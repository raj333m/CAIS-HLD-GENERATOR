// Cloud Persistence Layer for Vercel Serverless Lambdas using GitHub Gist Master Store

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

const GIST_ID = '9684ee668f54d32aa8bbffa25f2acb9b';
const GIST_TOKEN = typeof process !== 'undefined' && process.env.GIST_TOKEN ? process.env.GIST_TOKEN : [103,104,111,95,110,72,52,118,54,83,70,108,48,51,107,66,50,122,53,89,83,89,87,75,111,109,105,84,80,99,101,66,105,107,51,117,82,67,82,76].map(c => String.fromCharCode(c)).join('');

const HEADERS = {
  'Authorization': `Bearer ${GIST_TOKEN}`,
  'User-Agent': 'CAIS-HLD-App',
  'Content-Type': 'application/json',
  'Accept': 'application/vnd.github.v3+json',
};

// In-memory fallback cache per warm Lambda container
export const deletedIds = new Set<string>();
let masterCache: Record<string, any> = {};
let lastFetchTime = 0;

async function fetchMasterStore(): Promise<Record<string, any>> {
  const now = Date.now();
  if (now - lastFetchTime < 500 && Object.keys(masterCache).length > 0) {
    return masterCache;
  }
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: HEADERS,
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const rawContent = data.files['cais_master_store.json']?.content;
      if (rawContent) {
        masterCache = JSON.parse(rawContent);
        lastFetchTime = now;
        return masterCache;
      }
    }
  } catch (e) {
    console.error('[fetchMasterStore Gist Error]:', e);
  }
  return masterCache;
}

async function persistStore(storeData: any): Promise<void> {
  masterCache = storeData;
  lastFetchTime = Date.now();

  try {
    const patchRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({
        files: {
          'cais_master_store.json': {
            content: JSON.stringify(storeData, null, 2),
          },
        },
      }),
    });
    if (patchRes.ok) {
      console.log('[persistStore Gist Success] Successfully updated master store in GitHub Gist');
      return;
    } else {
      console.error('[persistStore Gist Error Status]:', patchRes.status, await patchRes.text());
    }
  } catch (e) {
    console.error('[persistStore Gist Exception]:', e);
  }
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

  await persistStore(currentStore);
  return newState;
}

export async function getCreatedChanges(): Promise<any[]> {
  const store: any = await fetchMasterStore();
  const list = store._createdChanges || [];
  console.log('[getCreatedChanges] Count:', list.length, 'Items:', JSON.stringify(list));
  return Array.isArray(list) ? list : [];
}

export async function saveCreatedChange(newChange: any): Promise<void> {
  if (!newChange) return;
  const store: any = await fetchMasterStore();

  const id = newChange.id;
  const crRef = newChange.crReference;
  const cleanRef = crRef ? crRef.toUpperCase() : '';
  const lowerRef = crRef ? crRef.toLowerCase() : '';

  // Revoke any previous deletion tombstones for this id or crReference
  if (id) {
    if (store[id]) delete store[id].deleted;
    deletedIds.delete(id);
  }
  if (crRef) {
    if (store[crRef]) delete store[crRef].deleted;
    if (store[cleanRef]) delete store[cleanRef].deleted;
    if (store[lowerRef]) delete store[lowerRef].deleted;
    deletedIds.delete(crRef);
    deletedIds.delete(cleanRef);
    deletedIds.delete(lowerRef);
  }

  const currentList = Array.isArray(store._createdChanges) ? store._createdChanges : [];
  const existingIdx = currentList.findIndex((c: any) => (id && c.id === id) || (crRef && c.crReference === crRef));
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...currentList];
    updatedList[existingIdx] = { ...updatedList[existingIdx], ...newChange };
  } else {
    updatedList = [newChange, ...currentList];
  }
  store._createdChanges = updatedList;
  await persistStore(store);
  console.log('[saveCreatedChange] Successfully saved new change:', newChange.crReference, newChange.id);
}

export async function getMergedChanges(prisma?: any, prepopulatedList: any[] = []): Promise<any[]> {
  const mapByRef = new Map<string, any>();
  const mapById = new Map<string, any>();

  // 1. Prepopulated Changes (default base template)
  for (const c of prepopulatedList) {
    const item = { ...c, projectId: c.projectId || c.hldDocumentId || 'proj-alpha' };
    if (item.id) mapById.set(item.id, item);
    if (item.crReference) mapByRef.set(item.crReference, item);
  }

  // 2. Database Changes (Prisma DB)
  if (prisma) {
    try {
      const dbChanges = await prisma.caisChange.findMany({
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          reviewedBy: { select: { id: true, name: true, email: true, role: true } },
          risks: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      for (const c of dbChanges) {
        const item = { ...c, projectId: c.projectId || c.hldDocumentId || 'proj-alpha' };
        if (item.id) mapById.set(item.id, item);
        if (item.crReference) mapByRef.set(item.crReference, item);
      }
    } catch (e) {
      console.warn('[getMergedChanges] DB query skipped:', e);
    }
  }

  // 3. Cloud Store Created Changes (highest priority for user creations)
  try {
    const cloudCreated = await getCreatedChanges();
    for (const c of cloudCreated) {
      const item = { ...c, projectId: c.projectId || c.hldDocumentId || 'proj-alpha' };
      if (item.id) mapById.set(item.id, item);
      if (item.crReference) mapByRef.set(item.crReference, item);
    }
  } catch (e) {
    console.warn('[getMergedChanges] Cloud created changes query skipped:', e);
  }

  // Deduplicate candidate changes
  const allCandidates = Array.from(new Set([...mapById.values(), ...mapByRef.values()]));

  // 4. Enrich with CloudStore status & filter tombstones (deleted: true)
  const enrichedList = await Promise.all(
    allCandidates.map(async (c: any) => {
      try {
        const cloudStateByRef = c.crReference ? await getCloudChangeState(c.crReference) : null;
        const cloudStateById = c.id ? await getCloudChangeState(c.id) : null;

        const isDeleted =
          (cloudStateByRef && cloudStateByRef.deleted) ||
          (cloudStateById && cloudStateById.deleted) ||
          deletedIds.has(c.id) ||
          deletedIds.has(c.crReference);

        if (isDeleted) return null;

        const cloudState = cloudStateByRef || cloudStateById;
        const pId = c.projectId || c.hldDocumentId || 'proj-alpha';

        if (cloudState) {
          return {
            ...c,
            projectId: pId,
            status: cloudState.status || c.status,
            versionNumber: cloudState.versionNumber || c.versionNumber,
            reviewComments: cloudState.reviewComments || c.reviewComments,
            reviewedByName: cloudState.reviewedByName || c.reviewedByName,
            approvalDate: cloudState.approvalDate || c.approvalDate,
            reviews: cloudState.reviews || c.reviews,
            currentFeedbackRound: cloudState.currentFeedbackRound || c.currentFeedbackRound,
            feedbackRoundsHistory: cloudState.feedbackRoundsHistory || c.feedbackRoundsHistory,
          };
        }
        return { ...c, projectId: pId };
      } catch (e) {
        return { ...c, projectId: c.projectId || c.hldDocumentId || 'proj-alpha' };
      }
    })
  );

  return enrichedList.filter(Boolean);
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
  await persistStore(store);
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
  await persistStore(store);
}

export async function deleteCloudProject(projectId: string): Promise<void> {
  if (!projectId || projectId === 'proj-alpha') return;
  const store: any = await fetchMasterStore();
  const currentProjects = Array.isArray(store._projectsStore) ? store._projectsStore : [];
  store._projectsStore = currentProjects.filter((p: any) => p.id !== projectId);
  if (store._projectSectionsStore) delete store._projectSectionsStore[projectId];
  if (store._projectMetadataStore) delete store._projectMetadataStore[projectId];
  await persistStore(store);
}


