// Cloud Persistence Layer for Vercel Serverless Lambdas

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
  updatedAt: string;
}

// In-memory fallback cache per Lambda lifecycle
const memoryStore: Record<string, CloudChangeState> = {};
const objectIdMap: Record<string, string> = {};

const REST_API_BASE = 'https://api.restful-api.dev/objects';

export async function getCloudChangeState(changeRef: string): Promise<CloudChangeState | null> {
  if (!changeRef) return null;
  const cleanRef = changeRef.replace(/^change-/, '').toUpperCase();

  // Return memory store if available in warm container
  if (memoryStore[cleanRef]) {
    try {
      // Background async re-sync with cloud
      syncFromCloud(cleanRef);
    } catch (e) {}
    return memoryStore[cleanRef];
  }

  return await fetchFromCloud(cleanRef);
}

async function fetchFromCloud(cleanRef: string): Promise<CloudChangeState | null> {
  try {
    const objectId = objectIdMap[cleanRef];
    if (objectId) {
      const res = await fetch(`${REST_API_BASE}/${objectId}`, { cache: 'no-store' });
      if (res.ok) {
        const item = await res.json();
        if (item && item.data) {
          memoryStore[cleanRef] = item.data;
          return item.data;
        }
      }
    }

    // Query objects list
    const listRes = await fetch(REST_API_BASE, { cache: 'no-store' });
    if (listRes.ok) {
      const items = await listRes.json();
      if (Array.isArray(items)) {
        const targetName = `cais_change_${cleanRef}`;
        const found = items.find((item: any) => item.name === targetName);
        if (found && found.data) {
          objectIdMap[cleanRef] = found.id;
          memoryStore[cleanRef] = found.data;
          return found.data;
        }
      }
    }
  } catch (e) {
    console.warn('getCloudChangeState failed:', e);
  }

  return memoryStore[cleanRef] || null;
}

async function syncFromCloud(cleanRef: string) {
  fetchFromCloud(cleanRef).catch(() => {});
}

export async function saveCloudChangeState(
  changeRef: string,
  updates: Partial<CloudChangeState>
): Promise<CloudChangeState> {
  if (!changeRef) {
    throw new Error('changeRef is required');
  }

  const cleanRef = changeRef.replace(/^change-/, '').toUpperCase();
  const existing = (await getCloudChangeState(cleanRef)) || {
    crReference: cleanRef,
    status: 'IN_REVIEW',
    versionNumber: 1,
    reviews: {},
    feedbackRoundsHistory: [],
    updatedAt: new Date().toISOString(),
  };

  const newState: CloudChangeState = {
    ...existing,
    ...updates,
    reviews: {
      ...existing.reviews,
      ...(updates.reviews || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  memoryStore[cleanRef] = newState;

  try {
    const objectId = objectIdMap[cleanRef];
    if (objectId) {
      const putRes = await fetch(`${REST_API_BASE}/${objectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `cais_change_${cleanRef}`,
          data: newState,
        }),
      });
      if (!putRes.ok) {
        // Fallback create if object was deleted
        await createNewCloudObject(cleanRef, newState);
      }
    } else {
      await createNewCloudObject(cleanRef, newState);
    }
  } catch (e) {
    console.warn('saveCloudChangeState network update failed:', e);
  }

  return newState;
}

async function createNewCloudObject(cleanRef: string, state: CloudChangeState) {
  try {
    const postRes = await fetch(REST_API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `cais_change_${cleanRef}`,
        data: state,
      }),
    });
    if (postRes.ok) {
      const created = await postRes.json();
      if (created && created.id) {
        objectIdMap[cleanRef] = created.id;
      }
    }
  } catch (e) {
    console.warn('createNewCloudObject failed:', e);
  }
}
