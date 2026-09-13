import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hld = await db.hldDocument.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
        dataItemImpacts: { include: { dataItem: true } },
        bureauNotes: { include: { bureau: true } },
        risks: true,
        stakeholders: true,
        comments: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
        versions: {
          include: { editedBy: { select: { id: true, name: true } } },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    if (!hld) {
      return NextResponse.json({ error: 'HLD document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, hld });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { content, title, targetMonth, description, regulatoryDriver } = body;

    const existing = await db.hldDocument.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'HLD not found' }, { status: 404 });
    }

    const newVersion = existing.version + 1;
    const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    const updated = await db.hldDocument.update({
      where: { id },
      data: {
        title: title || existing.title,
        targetMonth: targetMonth || existing.targetMonth,
        description: description || existing.description,
        regulatoryDriver: regulatoryDriver || existing.regulatoryDriver,
        content: contentString,
        version: newVersion,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
        dataItemImpacts: { include: { dataItem: true } },
        bureauNotes: { include: { bureau: true } },
        risks: true,
        stakeholders: true,
        comments: { include: { user: { select: { name: true } } } },
        versions: true,
      },
    });

    // Save version history log
    await db.hldVersion.create({
      data: {
        hldId: id,
        versionNumber: newVersion,
        snapshotContent: contentString,
        editedById: user.userId,
      },
    });

    return NextResponse.json({ success: true, hld: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required to delete HLDs' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await db.hldDocument.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'HLD deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
