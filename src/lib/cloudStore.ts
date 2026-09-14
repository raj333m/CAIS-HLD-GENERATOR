// Cloud Persistence Layer for Vercel Serverless Lambdas using Central REST Master Store

export interface CloudChangeState {
  crReference: string;
  status: string; // "IN_REVIEW" | "SENT_BACK" | "APPROVED" | "DRAFT"
  versionNumber: number;
  reviewedByName?: string;
  reviewComments?: string;
  approvalDate?: string;
  reviews: Record<string, any>;
  currentFeedbackRound?: any;
  feedbackRoundsHistory?: any[];
  addressedRemarks?: Record<string, boolean>;
  updatedAt: string;
}

const MASTER_STORE_ID = 'ff808181a09d98f701a09f462af602c3';
const REST_API_BASE = `https://api.restful-api.dev/objects/${MASTER_STORE_ID}`;

// In-memory fallback cache per warm Lambda container
let masterCache: Record<string, CloudChangeState> = {};
let lastFetchTime = 0;

async function fetchMasterStore(): Promise<Record<string, CloudChangeState>> {
  const now = Date.now();
  if (now - lastFetchTime < 1000 && Object.keys(masterCache).length > 0) {
    return masterCache;
  }
  try {
    const res = await fetch(REST_API_BASE, { cache: 'no-store' });
    if (res.ok) {
      const item = await res.json();
      if (item && item.data && typeof item.data === 'object') {
        masterCache = item.data;
        lastFetchTime = now;
        return masterCache;
      }
    }
  } catch (e) {
    console.warn('fetchMasterStore error:', e);
  }
  return masterCache;
}

export async function getCloudChangeState(changeRef: string): Promise<CloudChangeState | null> {
  if (!changeRef) return null;
  const cleanRef = changeRef.replace(/^change-/, '').toUpperCase();
  const store = await fetchMasterStore();
  return store[cleanRef] || null;
}

export async function saveCloudChangeState(
  changeRef: string,
  updates: Partial<CloudChangeState>
): Promise<CloudChangeState> {
  if (!changeRef) throw new Error('changeRef is required');
  const cleanRef = changeRef.replace(/^change-/, '').toUpperCase();

  const currentStore = await fetchMasterStore();
  const existing = currentStore[cleanRef] || {
    crReference: cleanRef,
    status: 'IN_REVIEW',
    versionNumber: 1,
    reviews: {},
    feedbackRoundsHistory: [],
    addressedRemarks: {},
    updatedAt: new Date().toISOString(),
  };

  const newState: CloudChangeState = {
    ...existing,
    ...updates,
    reviews: {
      ...existing.reviews,
      ...(updates.reviews || {}),
    },
    addressedRemarks: {
      ...existing.addressedRemarks,
      ...(updates.addressedRemarks || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  currentStore[cleanRef] = newState;
  masterCache = currentStore;
  lastFetchTime = Date.now();

  try {
    await fetch(REST_API_BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'cais_hld_master_store_v1',
        data: currentStore,
      }),
    });
  } catch (e) {
    console.warn('saveCloudChangeState PUT failed:', e);
  }

  return newState;
}
