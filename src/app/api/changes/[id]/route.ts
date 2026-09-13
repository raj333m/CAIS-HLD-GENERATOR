import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/changes/[id] - Fetch a single CAIS change entry
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const change = await prisma.caisChange.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        reviewedBy: { select: { id: true, name: true, email: true, role: true } },
        risks: true,
      },
    });

    if (!change) {
      return NextResponse.json({ error: 'Change entry not found' }, { status: 404 });
    }

    return NextResponse.json({ change });
  } catch (error: any) {
    console.error('Error fetching change:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/changes/[id] - Modify/Update a single CAIS change entry
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingChange = await prisma.caisChange.findUnique({ where: { id } });
    if (!existingChange) {
      return NextResponse.json({ error: 'Change entry not found' }, { status: 404 });
    }

    const {
      title,
      crReference,
      status,
      changeType,
      businessDriver,
      description,
      beforeText,
      afterText,
      sectionsUpdated,
      impactedBureaus,
      impactedDataItems,
      targetMonth,
      reviewedById,
      reviewComments,
    } = body;

    const updatedChange = await prisma.caisChange.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(crReference !== undefined && { crReference }),
        ...(status !== undefined && { status }),
        ...(changeType !== undefined && { changeType }),
        ...(businessDriver !== undefined && { businessDriver }),
        ...(description !== undefined && { description }),
        ...(beforeText !== undefined && { beforeText }),
        ...(afterText !== undefined && { afterText }),
        ...(sectionsUpdated !== undefined && { sectionsUpdated }),
        ...(impactedBureaus !== undefined && { impactedBureaus }),
        ...(impactedDataItems !== undefined && { impactedDataItems }),
        ...(targetMonth !== undefined && { targetMonth }),
        ...(reviewedById !== undefined && { reviewedById }),
        ...(reviewComments !== undefined && { reviewComments }),
        ...(status === 'APPROVED' && !existingChange.approvedAt && { approvedAt: new Date() }),
      },
      include: {
        createdBy: true,
        reviewedBy: true,
        risks: true,
      },
    });

    return NextResponse.json({ change: updatedChange });
  } catch (error: any) {
    console.error('Error updating change entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/changes/[id] - Delete a single CAIS change entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingChange = await prisma.caisChange.findUnique({ where: { id } });
    if (!existingChange) {
      return NextResponse.json({ error: 'Change entry not found' }, { status: 404 });
    }

    // Delete associated risks first
    await prisma.changeRisk.deleteMany({ where: { changeId: id } });

    // Delete the change entry
    await prisma.caisChange.delete({ where: { id } });

    return NextResponse.json({ message: 'Change entry deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting change entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
