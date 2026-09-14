import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/changes/[id]/review - Reviewer Approval or Send Back action
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status, reviewComments, reviewerId, updatedSectionContent } = body;

    const cleanRef = id.replace(/^change-/, '').toUpperCase();
    const existingChange = await prisma.caisChange.findFirst({
      where: {
        OR: [
          { id },
          { crReference: id },
          { crReference: cleanRef },
        ],
      },
    });

    if (!existingChange) {
      return NextResponse.json({ error: 'Change entry not found' }, { status: 404 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const defaultReviewer = await prisma.user.findFirst({ where: { role: 'REVIEWER' } });
    const activeReviewerId = reviewerId || defaultReviewer?.id;
    const reviewerNameStr = defaultReviewer?.name || 'Reviewer / Lead';

    // Update Change entry status
    const isSentBack = status === 'SENT_BACK' || status === 'DRAFT';
    const updatedChange = await prisma.caisChange.update({
      where: { id: existingChange.id },
      data: {
        status: status === 'SENT_BACK' ? 'SENT_BACK' : status, // "APPROVED" | "SENT_BACK" | "IN_REVIEW"
        reviewComments: reviewComments || existingChange.reviewComments,
        reviewedById: activeReviewerId || existingChange.reviewedById,
        reviewedByName: reviewerNameStr,
        approvalDate: status === 'APPROVED' ? todayStr : existingChange.approvalDate,
        approvedAt: status === 'APPROVED' ? new Date() : existingChange.approvedAt,
        versionNumber: isSentBack ? (existingChange.versionNumber || 1) + 1 : existingChange.versionNumber,
      },
      include: {
        createdBy: true,
        reviewedBy: true,
      },
    });

    if (existingChange.hldDocumentId) {
      try {
        await prisma.hldDocument.update({
          where: { id: existingChange.hldDocumentId },
          data: {
            status: status === 'APPROVED' ? 'APPROVED' : isSentBack ? 'DRAFT' : 'IN_REVIEW',
            reviewComments: reviewComments || existingChange.reviewComments,
            reviewedById: activeReviewerId || undefined,
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        console.warn('Failed to update linked HldDocument status:', err);
      }
    }

    // On Approval: Update living sub-sections & record section version snapshots
    if (status === 'APPROVED' && updatedSectionContent && typeof updatedSectionContent === 'object') {
      for (const [secNum, newContent] of Object.entries(updatedSectionContent)) {
        const targetSec = await prisma.documentSection.findUnique({
          where: { sectionNumber: secNum },
          include: { subSections: { orderBy: { displayOrder: 'asc' }, take: 1 } },
        });

        if (targetSec && targetSec.subSections.length > 0 && typeof newContent === 'string') {
          const targetSub = targetSec.subSections[0];

          const existingSub = await prisma.subSection.findUnique({
            where: { id: targetSub.id },
            include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
          });

          if (existingSub) {
            const nextVersionNum = (existingSub.versions[0]?.versionNumber || 1) + 1;
            const updatedBlocks = [
              {
                type: 'paragraph',
                payload: { text: `[APPROVED via ${updatedChange.crReference} - ${updatedChange.title}]\n${newContent}` },
              },
            ];

            await prisma.subSection.update({
              where: { id: targetSub.id },
              data: {
                contentBlocks: JSON.stringify(updatedBlocks),
                lastUpdatedById: updatedChange.createdById,
              },
            });

            await prisma.sectionVersion.create({
              data: {
                subSectionId: targetSub.id,
                versionNumber: nextVersionNum,
                contentSnapshot: JSON.stringify({
                  heading: targetSub.heading,
                  blocks: updatedBlocks,
                }),
                editedById: updatedChange.createdById,
                changeId: updatedChange.id,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ change: updatedChange });
  } catch (error: any) {
    console.error('Error reviewing change:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
