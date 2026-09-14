import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { saveCloudChangeState, getCloudChangeState } from '@/lib/cloudStore';

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
    let existingChange: any = null;
    try {
      existingChange = await prisma.caisChange.findFirst({
        where: {
          OR: [
            { id },
            { crReference: id },
            { crReference: cleanRef },
          ],
        },
      });
    } catch (dbErr) {
      console.warn('Prisma findFirst failed in review PUT:', dbErr);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let defaultReviewer: any = null;
    try {
      defaultReviewer = await prisma.user.findFirst({ where: { role: 'REVIEWER' } });
    } catch (e) {}
    const activeReviewerId = reviewerId || defaultReviewer?.id;
    const reviewerNameStr = defaultReviewer?.name || 'Reviewer / Lead';

    const isSentBack = status === 'SENT_BACK' || status === 'DRAFT';
    const finalStatus = status === 'SENT_BACK' ? 'SENT_BACK' : status;
    const currentVersion = existingChange?.versionNumber || 1;
    const nextVersion = isSentBack ? currentVersion + 1 : currentVersion;

    // Always update CloudStore so all Vercel Serverless Lambdas share the state
    const cloudState = await saveCloudChangeState(id, {
      status: finalStatus,
      versionNumber: nextVersion,
      reviewComments: reviewComments || existingChange?.reviewComments || undefined,
      reviewedByName: reviewerNameStr,
      approvalDate: status === 'APPROVED' ? todayStr : existingChange?.approvalDate || undefined,
    });

    let updatedChange: any = null;

    if (existingChange) {
      try {
        updatedChange = await prisma.caisChange.update({
          where: { id: existingChange.id },
          data: {
            status: finalStatus,
            reviewComments: reviewComments || existingChange.reviewComments,
            reviewedById: activeReviewerId || existingChange.reviewedById,
            reviewedByName: reviewerNameStr,
            approvalDate: status === 'APPROVED' ? todayStr : existingChange.approvalDate,
            approvedAt: status === 'APPROVED' ? new Date() : existingChange.approvedAt,
            versionNumber: nextVersion,
          },
          include: {
            createdBy: true,
            reviewedBy: true,
          },
        });

        if (existingChange.hldDocumentId) {
          await prisma.hldDocument.update({
            where: { id: existingChange.hldDocumentId },
            data: {
              status: status === 'APPROVED' ? 'APPROVED' : isSentBack ? 'DRAFT' : 'IN_REVIEW',
              reviewComments: reviewComments || existingChange.reviewComments,
              reviewedById: activeReviewerId || undefined,
              updatedAt: new Date(),
            },
          });
        }
      } catch (err) {
        console.warn('Prisma update failed in review PUT:', err);
      }
    }

    if (!updatedChange) {
      updatedChange = {
        id,
        crReference: cleanRef,
        status: cloudState.status,
        versionNumber: cloudState.versionNumber,
        reviewComments: cloudState.reviewComments || reviewComments,
        reviewedByName: cloudState.reviewedByName || reviewerNameStr,
        approvalDate: cloudState.approvalDate,
      };
    }

    // On Approval: Update living sub-sections & record section version snapshots
    if (status === 'APPROVED' && updatedSectionContent && typeof updatedSectionContent === 'object') {
      try {
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
                  payload: { text: `[APPROVED via ${updatedChange.crReference || cleanRef} - ${updatedChange.title || ''}]\n${newContent}` },
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
      } catch (e) {
        console.warn('Prisma subSection versioning failed in review PUT:', e);
      }
    }

    return NextResponse.json({ change: updatedChange, updatedChange });
  } catch (error: any) {
    console.error('Error reviewing change:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
