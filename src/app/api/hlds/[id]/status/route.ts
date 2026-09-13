import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

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
    const { status, reviewComments } = await req.json();

    if (!['DRAFT', 'IN_REVIEW', 'APPROVED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const existing = await db.hldDocument.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'HLD not found' }, { status: 404 });
    }

    // Role checks
    if (status === 'APPROVED' && user.role !== 'REVIEWER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only Reviewers or Admins can approve HLDs' }, { status: 403 });
    }

    const updateData: any = {
      status,
      reviewComments: reviewComments !== undefined ? reviewComments : existing.reviewComments,
    };

    if (status === 'APPROVED' || status === 'DRAFT') {
      updateData.reviewedById = user.userId;
    }

    // Parse existing JSON content to update Document Control metadata inside content
    try {
      const parsedContent = JSON.parse(existing.content);
      if (parsedContent.docControl) {
        parsedContent.docControl.status = status;
        if (status === 'APPROVED') {
          parsedContent.docControl.reviewer = user.name;
          parsedContent.docControl.approvalDate = new Date().toISOString().split('T')[0];
        }
        updateData.content = JSON.stringify(parsedContent, null, 2);
      }
    } catch (e) {
      // ignore JSON parse error
    }

    const updated = await db.hldDocument.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Add audit comment if reviewer sent comments
    if (reviewComments) {
      await db.hldComment.create({
        data: {
          hldId: id,
          userId: user.userId,
          text: `[Status changed to ${status}] ${reviewComments}`,
        },
      });
    }

    return NextResponse.json({ success: true, hld: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
