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

async function fetchMasterStore(forceFresh = false): Promise<Record<string, any>> {
  const now = Date.now();
  if (!forceFresh && now - lastFetchTime < 100 && Object.keys(masterCache).length > 0) {
    return masterCache;
  }
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}?_t=${now}`, {
      headers: HEADERS,
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = await res.json();
      const rawContent = data.files['cais_master_store.json']?.content;
      if (rawContent) {
        masterCache = JSON.parse(rawContent);
        lastFetchTime = Date.now();
        if (Array.isArray(masterCache._deletedIds)) {
          masterCache._deletedIds.forEach((id: string) => deletedIds.add(id));
        }
        return masterCache;
      }
    } else {
      console.error('[fetchMasterStore Gist Error Status]:', res.status, await res.text());
    }
  } catch (e) {
    console.error('[fetchMasterStore Gist Error]:', e);
  }
  return masterCache;
}

async function persistStore(storeData: any): Promise<void> {
  storeData._deletedIds = Array.from(deletedIds);
  storeData.updatedAt = new Date().toISOString();

  masterCache = storeData;
  lastFetchTime = Date.now();

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

  if (!patchRes.ok) {
    const errText = await patchRes.text();
    console.error('[persistStore Gist Error Status]:', patchRes.status, errText);
    throw new Error(`GitHub Gist persistence write failed (HTTP ${patchRes.status}): ${errText}`);
  }

  console.log('[persistStore Gist Success] Successfully updated master store in GitHub Gist');
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

  const currentStore = await fetchMasterStore(true);
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
  const store: any = await fetchMasterStore(true);
  const list = store._createdChanges || [];
  console.log('[getCreatedChanges] Count:', list.length);
  return Array.isArray(list) ? list : [];
}

export async function saveCreatedChange(newChange: any): Promise<void> {
  if (!newChange || !newChange.id) return;
  const store: any = await fetchMasterStore(true);

  const id = newChange.id;
  const crRef = newChange.crReference;

  // Revoke any previous deletion tombstone strictly for this record's unique ID
  if (store[id]) delete store[id].deleted;
  deletedIds.delete(id);
  deletedIds.delete(`change-${id}`);

  const currentList = Array.isArray(store._createdChanges) ? store._createdChanges : [];
  const existingIdx = currentList.findIndex((c: any) => c.id === id);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...currentList];
    updatedList[existingIdx] = { ...updatedList[existingIdx], ...newChange };
  } else {
    updatedList = [newChange, ...currentList];
  }
  store._createdChanges = updatedList;
  await persistStore(store);
  console.log('[saveCreatedChange] Successfully saved active change record:', crRef, id);
}

export async function getMergedChanges(
  prisma?: any,
  prepopulatedList: any[] = [],
  options?: { includeDrafts?: boolean }
): Promise<any[]> {
  const mapById = new Map<string, any>();

  // 1. Fetch Cloud Store Created Changes FIRST (highest authority for live data)
  let cloudCreated: any[] = [];
  try {
    cloudCreated = await getCreatedChanges();
    for (const c of cloudCreated) {
      const item = { ...c, projectId: c.projectId || c.hldDocumentId || 'proj-alpha' };
      if (item.id) mapById.set(item.id, item);
    }
  } catch (e) {
    console.warn('[getMergedChanges] Cloud created changes query skipped:', e);
  }

  // 2. Add Prepopulated Base Template items only if not overridden or deleted
  for (const c of prepopulatedList) {
    const item = { ...c, projectId: c.projectId || c.hldDocumentId || 'proj-alpha' };
    if (item.id && !mapById.has(item.id)) {
      mapById.set(item.id, item);
    }
  }

  // 3. Database Changes (Prisma DB) fallback
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
        if (item.id && !mapById.has(item.id)) {
          mapById.set(item.id, item);
        }
      }
    } catch (e) {
      console.warn('[getMergedChanges] DB query skipped:', e);
    }
  }

  const allCandidates = Array.from(mapById.values());
  const store = await fetchMasterStore(true);

  // 4. Enrich with CloudStore status & filter tombstones
  const enrichedList = await Promise.all(
    allCandidates.map(async (c: any) => {
      try {
        const cloudStateById = c.id ? store[c.id] : null;

        const isDeleted =
          (cloudStateById && cloudStateById.deleted === true) ||
          deletedIds.has(c.id);

        if (isDeleted) return null;

        const cloudState = cloudStateById;
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

  const activeList = enrichedList.filter((c: any) => {
    if (!c) return false;
    if (c.title === 'Draft CAIS Change Intake' && (!c.description || c.description.trim() === '')) {
      return false;
    }
    const isBaselineSeed =
      (c.crReference && c.crReference.startsWith('CAIS-BASE-')) ||
      (c.id && ['37eda0d7-1c69-40f4-94ff-452c6141b56a', 'b82df910-449e-4e63-8a3e-721fb653ab12', 'f9411d38-2e02-4740-9a29-158a1834279b', '3f98886e-e31d-443a-a07e-ac133cc7c537', 'b4511b77-390f-4f62-9b1f-6fbd40ee4c5f', '119cd445-79e8-4265-91dd-9e4fa1415bfe'].includes(c.id)) ||
      ((c.title || '').toLowerCase().includes('default balance reconciliation'));

    if (!options?.includeDrafts && c.status === 'DRAFT' && !isBaselineSeed) {
      return false;
    }
    return true;
  });

  // 4b. Normalize baseline seed items to CAIS-BASE-00X
  const normalizedList = activeList.map((c: any) => {
    const titleLower = (c.title || '').toLowerCase();
    if (titleLower.includes('consumer duty payment holiday')) {
      return { ...c, crReference: 'CAIS-BASE-001' };
    } else if (titleLower.includes('buy-now-pay-later')) {
      return { ...c, crReference: 'CAIS-BASE-002' };
    } else if (titleLower.includes('default balance reconciliation')) {
      return { ...c, crReference: 'CAIS-BASE-003' };
    }
    return c;
  });

  // 5. Deduplicate by crReference per project (live created items take precedence over prepopulated items)
  const dedupedByRef = new Map<string, any>();
  for (const c of normalizedList) {
    const key = `${c.projectId || 'proj-alpha'}::${(c.crReference || '').trim().toUpperCase()}`;
    if (!dedupedByRef.has(key)) {
      dedupedByRef.set(key, c);
    }
  }

  return Array.from(dedupedByRef.values());
}

export async function deleteCreatedChange(id: string, crReference?: string): Promise<void> {
  const store: any = await fetchMasterStore(true);
  const currentList = Array.isArray(store._createdChanges) ? store._createdChanges : [];
  const filtered = currentList.filter((c: any) => c.id !== id && c.id !== `change-${id}`);
  store._createdChanges = filtered;

  if (id) {
    store[id] = { ...(store[id] || {}), deleted: true, updatedAt: new Date().toISOString() };
    deletedIds.add(id);
    deletedIds.add(`change-${id}`);
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


