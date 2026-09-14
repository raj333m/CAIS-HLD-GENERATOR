import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

function loadReviewsState() {
  try {
    const filePath = getStoreFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        reviews: parsed.reviews || {},
        currentFeedbackRound: parsed.currentFeedbackRound || null,
        feedbackRoundsHistory: parsed.feedbackRoundsHistory || [],
        addressedRemarks: parsed.addressedRemarks || {},
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
  };
}

function saveReviewsState(state: any) {
  try {
    const filePath = getStoreFilePath();
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save reviews state to disk:', err);
  }
}

export async function GET(req: NextRequest) {
  const state = loadReviewsState();
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
    const { sectionNum, action, feedback, reviewerName, reviewerRole, overallReason, sectionRemarks } = body;

    const state = loadReviewsState();
    let { reviews, currentFeedbackRound, feedbackRoundsHistory, addressedRemarks } = state;

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
      saveReviewsState(newState);

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
      saveReviewsState(newState);

      return NextResponse.json({
        success: true,
        addressedRemarks,
        allReviews: reviews,
      });
    }

    if (action === 'RESET_ALL') {
      // Reset all section approvals back to PENDING on BA resubmission
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
      saveReviewsState(newState);

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
    saveReviewsState(newState);

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
