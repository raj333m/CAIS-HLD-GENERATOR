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
  deleted?: boolean;
  updatedAt: string;
}

let MASTER_STORE_ID = 'ff808181a09d98f701a0a0eb1b730678';
let REST_API_BASE = `https://api.restful-api.dev/objects/${MASTER_STORE_ID}`;

// In-memory fallback cache per warm Lambda container
export const deletedIds = new Set<string>();
let masterCache: Record<string, any> = {};
let lastFetchTime = 0;

async function getMasterStoreUrl(): Promise<string> {
  if (REST_API_BASE) return REST_API_BASE;
  return `https://api.restful-api.dev/objects/${MASTER_STORE_ID}`;
}

async function fetchMasterStore(): Promise<Record<string, any>> {
  const now = Date.now();
  if (now - lastFetchTime < 100 && Object.keys(masterCache).length > 0) {
    return masterCache;
  }
  try {
    const url = await getMasterStoreUrl();
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const item = await res.json();
      if (item && item.data && typeof item.data === 'object') {
        masterCache = item.data;
        lastFetchTime = now;
        return masterCache;
      }
    } else if (res.status === 404) {
      // Auto-provision fresh store if 404
      const createRes = await fetch('https://api.restful-api.dev/objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'cais_hld_master_store_production_v59',
          data: {
            _createdChanges: [],
            _projectsStore: [],
            _projectSectionsStore: {},
            _projectMetadataStore: {},
            updatedAt: new Date().toISOString()
          }
        })
      });
      if (createRes.ok) {
        const createdObj = await createRes.json();
        MASTER_STORE_ID = createdObj.id;
        REST_API_BASE = `https://api.restful-api.dev/objects/${MASTER_STORE_ID}`;
        masterCache = createdObj.data || {};
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
  const store = await fetchMasterStore();
  const cleanRef = changeRef.replace(/^change-/, '').toUpperCase();
  const lowerRef = changeRef.toLowerCase();
  return store[changeRef] || store[cleanRef] || store[lowerRef] || store[changeRef.toUpperCase()] || null;
}

export async function saveCloudChangeState(
  changeRef: string,
  updates: Partial<CloudChangeState>
): Promise<CloudChangeState> {
  if (!changeRef) throw new Error('changeRef is required');
  const cleanRef = changeRef.replace(/^change-/, '').toUpperCase();
  const lowerRef = changeRef.toLowerCase();

  const currentStore = await fetchMasterStore();
  const existing = currentStore[changeRef] || currentStore[cleanRef] || currentStore[lowerRef] || {
    crReference: updates.crReference || cleanRef,
    status: 'IN_REVIEW',
    versionNumber: 1,
    reviews: {},
    feedbackRoundsHistory: [],
    addressedRemarks: {},
    updatedAt: new Date().toISOString(),
  };

  const cleanedUpdates: Record<string, any> = {};
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined) {
      cleanedUpdates[k] = v;
    }
  }

  const newState: CloudChangeState = {
    ...existing,
    ...cleanedUpdates,
    ...(updates.deleted !== undefined ? { deleted: updates.deleted } : {}),
    reviews: {
      ...(existing.reviews || {}),
      ...(updates.reviews || {}),
    },
    addressedRemarks: {
      ...(existing.addressedRemarks || {}),
      ...(updates.addressedRemarks || {}),
    },
    currentFeedbackRound: updates.currentFeedbackRound !== undefined ? updates.currentFeedbackRound : existing.currentFeedbackRound,
    feedbackRoundsHistory: updates.feedbackRoundsHistory !== undefined ? updates.feedbackRoundsHistory : existing.feedbackRoundsHistory,
    updatedAt: new Date().toISOString(),
  };

  currentStore[changeRef] = newState;
  currentStore[cleanRef] = newState;
  currentStore[lowerRef] = newState;
  if (updates.crReference) {
    currentStore[updates.crReference] = newState;
    currentStore[updates.crReference.toUpperCase()] = newState;
    currentStore[updates.crReference.toLowerCase()] = newState;
  }

  masterCache = currentStore;
  lastFetchTime = Date.now();

  try {
    const url = await getMasterStoreUrl();
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'cais_hld_master_store_production_v59',
        data: currentStore,
      }),
    });
  } catch (e) {
    console.warn('saveCloudChangeState PUT failed:', e);
  }

  return newState;
}

export async function getCreatedChanges(): Promise<any[]> {
  const store: any = await fetchMasterStore();
  const list = store._createdChanges || [];
  return Array.isArray(list) ? list : [];
}

export async function saveCreatedChange(newChange: any): Promise<void> {
  if (!newChange) return;
  const store: any = await fetchMasterStore();
  const currentList = Array.isArray(store._createdChanges) ? store._createdChanges : [];
  const existingIdx = currentList.findIndex((c: any) => c.id === newChange.id || c.crReference === newChange.crReference);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...currentList];
    updatedList[existingIdx] = { ...updatedList[existingIdx], ...newChange };
  } else {
    updatedList = [newChange, ...currentList];
  }
  store._createdChanges = updatedList;
  masterCache = store;
  lastFetchTime = Date.now();
  try {
    const url = await getMasterStoreUrl();
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'cais_hld_master_store_production_v59', data: store }),
    });
  } catch (e) {
    console.warn('saveCreatedChange PUT failed:', e);
  }
}

export async function deleteCreatedChange(id: string, crReference?: string): Promise<void> {
  const store: any = await fetchMasterStore();
  const currentList = Array.isArray(store._createdChanges) ? store._createdChanges : [];
  const cleanRef = crReference ? crReference.toUpperCase() : '';
  const filtered = currentList.filter((c: any) => {
    if (c.id === id || c.id === `change-${id}`) return false;
    if (crReference && (c.crReference === crReference || c.crReference?.toUpperCase() === cleanRef)) return false;
    return true;
  });
  store._createdChanges = filtered;
  if (id) {
    store[id] = { ...(store[id] || {}), deleted: true, updatedAt: new Date().toISOString() };
  }
  if (crReference) {
    store[crReference] = { ...(store[crReference] || {}), deleted: true, updatedAt: new Date().toISOString() };
    store[cleanRef] = { ...(store[cleanRef] || {}), deleted: true, updatedAt: new Date().toISOString() };
  }
  masterCache = store;
  lastFetchTime = Date.now();
  try {
    const url = await getMasterStoreUrl();
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'cais_hld_master_store_production_v59', data: store }),
    });
  } catch (e) {}
}

export async function getCloudProjects(): Promise<{ projects: any[]; projectSections: Record<string, any[]>; projectMetadata: Record<string, any> }> {
  const store: any = await fetchMasterStore();
  return {
    projects: store._projectsStore || [],
    projectSections: store._projectSectionsStore || {},
    projectMetadata: store._projectMetadataStore || {},
  };
}

export async function saveCloudProject(project: any, sections?: any[], metadata?: any): Promise<void> {
  if (!project) return;
  const store: any = await fetchMasterStore();
  const currentProjects = Array.isArray(store._projectsStore) ? store._projectsStore : [];
  const existingIdx = currentProjects.findIndex((p: any) => p.id === project.id);
  let updatedProjects;
  if (existingIdx >= 0) {
    updatedProjects = [...currentProjects];
    updatedProjects[existingIdx] = { ...updatedProjects[existingIdx], ...project };
  } else {
    updatedProjects = [...currentProjects, project];
  }
  store._projectsStore = updatedProjects;
  if (sections) {
    store._projectSectionsStore = store._projectSectionsStore || {};
    store._projectSectionsStore[project.id] = sections;
  }
  if (metadata) {
    store._projectMetadataStore = store._projectMetadataStore || {};
    store._projectMetadataStore[project.id] = metadata;
  }
  masterCache = store;
  lastFetchTime = Date.now();
  try {
    const url = await getMasterStoreUrl();
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'cais_hld_master_store_production_v59', data: store }),
    });
  } catch (e) {
    console.warn('saveCloudProject PUT failed:', e);
  }
}

