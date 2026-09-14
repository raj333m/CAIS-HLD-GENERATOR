import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { getCloudChangeState, saveCloudChangeState } from '@/lib/cloudStore';

const prisma = new PrismaClient();

export interface SectionReviewData {
  sectionNum: string;
  status: 'APPROVED' | 'FEEDBACK_SHARED' | 'PENDING';
  feedback?: string;
  reviewerName?: string;
  timestamp?: string;
  approvalDate?: string;
  isAddressed?: boolean;
}

export interface FeedbackRound {
  roundNumber: number;
  reviewerName: string;
  reviewerRole: string;
  timestamp: string;
  overallReason: string;
  sectionRemarks: Array<{ sectionNum: string; remarkText: string; isAddressed?: boolean }>;
}

function getStoreFilePath() {
  try {
    const dir = path.join(process.cwd(), 'prisma');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, 'section_reviews_store.json');
  } catch (e) {
    return path.join('/tmp', 'section_reviews_store.json');
  }
}

function loadReviewsState(changeId?: string | null) {
  try {
    const filePath = getStoreFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (changeId) {
        const cleanKey = changeId.replace(/^change-/, '').toUpperCase();
        const changeSpecific = (parsed.byChange && (parsed.byChange[changeId] || parsed.byChange[cleanKey])) || {};
        return {
          reviews: changeSpecific.reviews || parsed.reviews || {},
          currentFeedbackRound: changeSpecific.currentFeedbackRound || parsed.currentFeedbackRound || null,
          feedbackRoundsHistory: changeSpecific.feedbackRoundsHistory || parsed.feedbackRoundsHistory || [],
          addressedRemarks: changeSpecific.addressedRemarks || parsed.addressedRemarks || {},
          rawStore: parsed,
        };
      }
      return {
        reviews: parsed.reviews || {},
        currentFeedbackRound: parsed.currentFeedbackRound || null,
        feedbackRoundsHistory: parsed.feedbackRoundsHistory || [],
        addressedRemarks: parsed.addressedRemarks || {},
        rawStore: parsed,
      };
    }
  } catch (err) {
    console.error('Failed to load reviews state from disk:', err);
  }
  return {
    reviews: {},
    currentFeedbackRound: null,
    feedbackRoundsHistory: [],
    addressedRemarks: {},
    rawStore: {},
  };
}

function saveReviewsState(state: any, changeId?: string | null) {
  try {
    const filePath = getStoreFilePath();
    let currentDisk: any = {};
    if (fs.existsSync(filePath)) {
      try {
        currentDisk = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {}
    }

    currentDisk.reviews = { ...(currentDisk.reviews || {}), ...(state.reviews || {}) };
    currentDisk.currentFeedbackRound = state.currentFeedbackRound !== undefined ? state.currentFeedbackRound : currentDisk.currentFeedbackRound;
    currentDisk.feedbackRoundsHistory = state.feedbackRoundsHistory || currentDisk.feedbackRoundsHistory || [];
    currentDisk.addressedRemarks = { ...(currentDisk.addressedRemarks || {}), ...(state.addressedRemarks || {}) };

    if (changeId) {
      if (!currentDisk.byChange) currentDisk.byChange = {};
      const cleanKey = changeId.replace(/^change-/, '').toUpperCase();
      const changeObj = {
        reviews: state.reviews || {},
        currentFeedbackRound: state.currentFeedbackRound || null,
        feedbackRoundsHistory: state.feedbackRoundsHistory || [],
        addressedRemarks: state.addressedRemarks || {},
      };
      currentDisk.byChange[changeId] = changeObj;
      currentDisk.byChange[cleanKey] = changeObj;
    }

    fs.writeFileSync(filePath, JSON.stringify(currentDisk, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save reviews state to disk:', err);
  }
}

async function findCaisChange(changeId: string) {
  if (!changeId) return null;
  const cleanRef = changeId.replace(/^change-/, '').toUpperCase();
  try {
    return await prisma.caisChange.findFirst({
      where: {
        OR: [
          { id: changeId },
          { crReference: changeId },
          { crReference: cleanRef },
          { id: { equals: changeId } },
        ],
      },
    });
  } catch (e) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const changeId = searchParams.get('changeId');
  const state = loadReviewsState(changeId);

  if (changeId) {
    try {
      // 1. Read from SQLite DB (authoritative change record)
      const change = await findCaisChange(changeId);
      if (change && change.reviewComments) {
        try {
          const parsed = JSON.parse(change.reviewComments);
          if (parsed && typeof parsed === 'object') {
            if (parsed.reviews && typeof parsed.reviews === 'object') {
              state.reviews = { ...state.reviews, ...parsed.reviews };
            }
            if (parsed.currentFeedbackRound) {
              state.currentFeedbackRound = parsed.currentFeedbackRound;
            }
            if (parsed.feedbackRoundsHistory && Array.isArray(parsed.feedbackRoundsHistory)) {
              state.feedbackRoundsHistory = parsed.feedbackRoundsHistory;
            }
          }
        } catch (e) {
          // Plain text comment fallback
        }
      }

      // 2. Read from CloudStore (cross-Lambda state) with fallback keys and merge
      const cloudState = (await getCloudChangeState(changeId)) ||
        (change?.crReference ? await getCloudChangeState(change.crReference) : null) ||
        (change?.id ? await getCloudChangeState(change.id) : null);

      if (cloudState) {
        if (cloudState.reviews && Object.keys(cloudState.reviews).length > 0) {
          state.reviews = { ...state.reviews, ...cloudState.reviews };
        }
        if (cloudState.currentFeedbackRound) {
          state.currentFeedbackRound = cloudState.currentFeedbackRound;
        }
        if (cloudState.feedbackRoundsHistory && cloudState.feedbackRoundsHistory.length > 0) {
          state.feedbackRoundsHistory = cloudState.feedbackRoundsHistory;
        }
      }
    } catch (dbErr) {
      console.warn('Lookup failed in GET /api/section-reviews:', dbErr);
    }
  }

  return NextResponse.json({
    reviews: state.reviews,
    currentFeedbackRound: state.currentFeedbackRound,
    feedbackRoundsHistory: state.feedbackRoundsHistory,
    addressedRemarks: state.addressedRemarks,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sectionNum, action, feedback, reviewerName, reviewerRole, overallReason, sectionRemarks, changeId } = body;

    const state = loadReviewsState(changeId);
    let { reviews, currentFeedbackRound, feedbackRoundsHistory, addressedRemarks } = state;

    // Merge existing DB & CloudStore reviews to prevent overwriting prior approvals
    if (changeId) {
      try {
        const change = await findCaisChange(changeId);
        if (change && change.reviewComments) {
          try {
            const parsed = JSON.parse(change.reviewComments);
            if (parsed && typeof parsed === 'object' && parsed.reviews) {
              reviews = { ...parsed.reviews, ...reviews };
            }
            if (parsed && parsed.currentFeedbackRound && !currentFeedbackRound) {
              currentFeedbackRound = parsed.currentFeedbackRound;
            }
            if (parsed && parsed.feedbackRoundsHistory && Array.isArray(parsed.feedbackRoundsHistory) && (!feedbackRoundsHistory || feedbackRoundsHistory.length === 0)) {
              feedbackRoundsHistory = parsed.feedbackRoundsHistory;
            }
          } catch (e) {}
        }

        const cloudState = (await getCloudChangeState(changeId)) ||
          (change?.crReference ? await getCloudChangeState(change.crReference) : null) ||
          (change?.id ? await getCloudChangeState(change.id) : null);

        if (cloudState) {
          if (cloudState.reviews && Object.keys(cloudState.reviews).length > 0) {
            reviews = { ...cloudState.reviews, ...reviews };
          }
          if (cloudState.currentFeedbackRound && !currentFeedbackRound) {
            currentFeedbackRound = cloudState.currentFeedbackRound;
          }
          if (cloudState.feedbackRoundsHistory && cloudState.feedbackRoundsHistory.length > 0 && (!feedbackRoundsHistory || feedbackRoundsHistory.length === 0)) {
            feedbackRoundsHistory = cloudState.feedbackRoundsHistory;
          }
        }
      } catch (e) {
        console.warn('POST lookup failed in /api/section-reviews:', e);
      }
    }

    const timestamp = new Date().toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    if (action === 'SEND_BACK_ROUND') {
      const nextRoundNum = (feedbackRoundsHistory || []).length + 1;
      const formattedRemarks = (sectionRemarks || []).map((sr: any) => ({
        sectionNum: sr.sectionNum,
        remarkText: sr.remarkText,
        isAddressed: false,
      }));

      const newRound: FeedbackRound = {
        roundNumber: nextRoundNum,
        reviewerName: reviewerName || 'Reviewer / Lead',
        reviewerRole: reviewerRole || 'Reviewer / Lead',
        timestamp,
        overallReason: overallReason || 'Revision requested — see section remarks for details.',
        sectionRemarks: formattedRemarks,
      };

      currentFeedbackRound = newRound;
      feedbackRoundsHistory = [...(feedbackRoundsHistory || []), newRound];
      addressedRemarks = {};

      // Mark sections as FEEDBACK_SHARED
      formattedRemarks.forEach((sr: any) => {
        reviews[sr.sectionNum] = {
          sectionNum: sr.sectionNum,
          status: 'FEEDBACK_SHARED',
          feedback: sr.remarkText,
          reviewerName: newRound.reviewerName,
          timestamp: newRound.timestamp,
          isAddressed: false,
        };
      });

      const newState = { reviews, currentFeedbackRound, feedbackRoundsHistory, addressedRemarks };
      saveReviewsState(newState, changeId);

      // Sync to cloudStore & SQLite DB
      if (changeId) {
        const payloadJson = JSON.stringify({
          overallReason: overallReason || newRound.overallReason,
          reviews,
          currentFeedbackRound: newRound,
          feedbackRoundsHistory,
        });

        try {
          const change = await findCaisChange(changeId);
          const crRef = change?.crReference || changeId;
          const targetId = change?.id || changeId;

          await saveCloudChangeState(targetId, {
            crReference: crRef,
            status: 'SENT_BACK',
            reviews,
            currentFeedbackRound: newRound,
            feedbackRoundsHistory,
            reviewedByName: reviewerName || 'Reviewer / Lead',
            reviewComments: payloadJson,
          });
          await saveCloudChangeState(crRef, {
            crReference: crRef,
            status: 'SENT_BACK',
            reviews,
            currentFeedbackRound: newRound,
            feedbackRoundsHistory,
            reviewedByName: reviewerName || 'Reviewer / Lead',
            reviewComments: payloadJson,
          });

          if (change) {
            await prisma.caisChange.update({
              where: { id: change.id },
              data: {
                status: 'SENT_BACK',
                reviewComments: payloadJson,
                reviewedByName: reviewerName || 'Reviewer / Lead',
                versionNumber: (change.versionNumber || 1) + 1,
              },
            });
          }
        } catch (e) {
          console.warn('DB update failed on SEND_BACK_ROUND:', e);
        }
      }

      return NextResponse.json({
        success: true,
        currentFeedbackRound,
        feedbackRoundsHistory,
        allReviews: reviews,
      });
    }

    if (action === 'TOGGLE_ADDRESSED') {
      if (sectionNum) {
        addressedRemarks[sectionNum] = !addressedRemarks[sectionNum];
        if (reviews[sectionNum]) {
          reviews[sectionNum].isAddressed = addressedRemarks[sectionNum];
        }
      }
      const newState = { reviews, currentFeedbackRound, feedbackRoundsHistory, addressedRemarks };
      saveReviewsState(newState, changeId);

      return NextResponse.json({
        success: true,
        addressedRemarks,
        allReviews: reviews,
      });
    }

    if (action === 'RESET_ALL') {
      Object.keys(reviews).forEach((num) => {
        reviews[num] = {
          sectionNum: num,
          status: 'PENDING',
        };
      });

      if (currentFeedbackRound) {
        const exists = (feedbackRoundsHistory || []).some((r: any) => r.roundNumber === currentFeedbackRound?.roundNumber);
        if (!exists) {
          feedbackRoundsHistory = [...(feedbackRoundsHistory || []), currentFeedbackRound];
        }
      }

      const newState = { reviews, currentFeedbackRound, feedbackRoundsHistory, addressedRemarks };
      saveReviewsState(newState, changeId);

      return NextResponse.json({
        success: true,
        allReviews: reviews,
        currentFeedbackRound,
        feedbackRoundsHistory,
      });
    }

    if (!sectionNum || !action) {
      return NextResponse.json({ error: 'Section number and action are required' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      const approvalDateStr = new Date().toISOString().split('T')[0];
      reviews[sectionNum] = {
        sectionNum,
        status: 'APPROVED',
        feedback: undefined,
        reviewerName: reviewerName || 'Reviewer / Lead',
        timestamp,
        approvalDate: approvalDateStr,
      };
    } else if (action === 'SHARE_FEEDBACK') {
      reviews[sectionNum] = {
        sectionNum,
        status: 'FEEDBACK_SHARED',
        feedback: feedback || 'Please review and update this section as per technical standards.',
        reviewerName: reviewerName || 'Reviewer / Lead',
        timestamp,
      };
    } else if (action === 'RESET') {
      reviews[sectionNum] = {
        sectionNum,
        status: 'PENDING',
      };
    }

    const newState = { reviews, currentFeedbackRound, feedbackRoundsHistory, addressedRemarks };
    saveReviewsState(newState, changeId);

    // Sync to cloudStore & SQLite DB via Prisma
    if (changeId) {
      const payloadJson = JSON.stringify({
        reviews,
        currentFeedbackRound,
        feedbackRoundsHistory,
      });

      try {
        const change = await findCaisChange(changeId);
        const crRef = change?.crReference || changeId;
        const targetId = change?.id || changeId;

        await saveCloudChangeState(targetId, {
          crReference: crRef,
          reviews,
          currentFeedbackRound,
          feedbackRoundsHistory,
          reviewedByName: reviewerName || 'Reviewer / Lead',
          reviewComments: payloadJson,
        });
        await saveCloudChangeState(crRef, {
          crReference: crRef,
          reviews,
          currentFeedbackRound,
          feedbackRoundsHistory,
          reviewedByName: reviewerName || 'Reviewer / Lead',
          reviewComments: payloadJson,
        });

        if (change) {
          await prisma.caisChange.update({
            where: { id: change.id },
            data: {
              status: change.status === 'DRAFT' ? 'IN_REVIEW' : change.status,
              reviewComments: payloadJson,
              reviewedByName: reviewerName || change.reviewedByName || 'Reviewer / Lead',
            },
          });
        }
      } catch (dbErr) {
        console.warn('Prisma update failed in POST /api/section-reviews:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      review: reviews[sectionNum],
      allReviews: reviews,
      currentFeedbackRound,
      feedbackRoundsHistory,
    });
  } catch (error: any) {
    console.error('Section reviews API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update section review' }, { status: 500 });
  }
}
