import { NextRequest, NextResponse } from 'next/server';

export interface SectionReviewData {
  sectionNum: string;
  status: 'APPROVED' | 'FEEDBACK_SHARED' | 'PENDING';
  feedback?: string;
  reviewerName?: string;
  timestamp?: string;
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

let sectionReviewsStore: Record<string, SectionReviewData> = {};
let activeFeedbackRoundStore: FeedbackRound | null = null;
let feedbackRoundsHistoryStore: FeedbackRound[] = [];
let addressedRemarksStore: Record<string, boolean> = {};

export async function GET(req: NextRequest) {
  return NextResponse.json({
    reviews: sectionReviewsStore,
    currentFeedbackRound: activeFeedbackRoundStore,
    feedbackRoundsHistory: feedbackRoundsHistoryStore,
    addressedRemarks: addressedRemarksStore,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sectionNum, action, feedback, reviewerName, reviewerRole, overallReason, sectionRemarks } = body;

    const timestamp = new Date().toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    if (action === 'SEND_BACK_ROUND') {
      const nextRoundNum = feedbackRoundsHistoryStore.length + 1;
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

      activeFeedbackRoundStore = newRound;
      feedbackRoundsHistoryStore.push(newRound);
      addressedRemarksStore = {};

      // Mark sections as FEEDBACK_SHARED
      formattedRemarks.forEach((sr: any) => {
        sectionReviewsStore[sr.sectionNum] = {
          sectionNum: sr.sectionNum,
          status: 'FEEDBACK_SHARED',
          feedback: sr.remarkText,
          reviewerName: newRound.reviewerName,
          timestamp: newRound.timestamp,
          isAddressed: false,
        };
      });

      return NextResponse.json({
        success: true,
        currentFeedbackRound: activeFeedbackRoundStore,
        feedbackRoundsHistory: feedbackRoundsHistoryStore,
        allReviews: sectionReviewsStore,
      });
    }

    if (action === 'TOGGLE_ADDRESSED') {
      if (sectionNum) {
        addressedRemarksStore[sectionNum] = !addressedRemarksStore[sectionNum];
        if (sectionReviewsStore[sectionNum]) {
          sectionReviewsStore[sectionNum].isAddressed = addressedRemarksStore[sectionNum];
        }
      }
      return NextResponse.json({
        success: true,
        addressedRemarks: addressedRemarksStore,
        allReviews: sectionReviewsStore,
      });
    }

    if (action === 'RESET_ALL') {
      // Reset all section approvals back to PENDING on BA resubmission
      Object.keys(sectionReviewsStore).forEach((num) => {
        sectionReviewsStore[num] = {
          sectionNum: num,
          status: 'PENDING',
        };
      });

      if (activeFeedbackRoundStore) {
        // Archive active round into history if not already present
        const exists = feedbackRoundsHistoryStore.some(r => r.roundNumber === activeFeedbackRoundStore?.roundNumber);
        if (!exists) {
          feedbackRoundsHistoryStore.push(activeFeedbackRoundStore);
        }
      }

      return NextResponse.json({
        success: true,
        allReviews: sectionReviewsStore,
        currentFeedbackRound: activeFeedbackRoundStore,
        feedbackRoundsHistory: feedbackRoundsHistoryStore,
      });
    }

    if (!sectionNum || !action) {
      return NextResponse.json({ error: 'Section number and action are required' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      sectionReviewsStore[sectionNum] = {
        sectionNum,
        status: 'APPROVED',
        feedback: undefined,
        reviewerName: reviewerName || 'Reviewer / Lead',
        timestamp,
      };
    } else if (action === 'SHARE_FEEDBACK') {
      sectionReviewsStore[sectionNum] = {
        sectionNum,
        status: 'FEEDBACK_SHARED',
        feedback: feedback || 'Please review and update this section as per technical standards.',
        reviewerName: reviewerName || 'Reviewer / Lead',
        timestamp,
      };
    } else if (action === 'RESET') {
      sectionReviewsStore[sectionNum] = {
        sectionNum,
        status: 'PENDING',
      };
    }

    return NextResponse.json({
      success: true,
      review: sectionReviewsStore[sectionNum],
      allReviews: sectionReviewsStore,
      currentFeedbackRound: activeFeedbackRoundStore,
      feedbackRoundsHistory: feedbackRoundsHistoryStore,
    });
  } catch (error: any) {
    console.error('Section reviews API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update section review' }, { status: 500 });
  }
}
