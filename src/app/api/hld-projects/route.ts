import { NextRequest, NextResponse } from 'next/server';
import { MASTER_SECTIONS, BLANK_SECTIONS } from '@/lib/sectionsData';
import { getCloudProjects, saveCloudProject, deleteCloudProject } from '@/lib/cloudStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface HldProject {
  id: string;
  projectName: string;
  targetBrand: string;
  targetBrands?: string[];
  targetProducts?: string[];
  targetDate: string;
  createdAt: string;
  sections?: any[];
}

function getTodayFormatted() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const initialDate = getTodayFormatted();

export const STATIC_INVOLVED_PARTIES = [
  { id: '1', Name: 'Manash R Chanda', Role: 'UKBI POD Lead' },
  { id: '2', Name: 'Swapnil Kalidas Sankpal', Role: 'Tech Lead' },
  { id: '3', Name: 'Vishnu Vardhan', Role: 'Senior Developer' },
  { id: '4', Name: 'Aishwarya Raj Singh', Role: 'Business Analyst' },
  { id: '5', Name: 'Narsimha Chary', Role: 'UKBI ITPM' },
];

export const STATIC_REVIEWED_BY = [
  { id: '1', Reviewer: 'Stuart H Lindsay', 'Role or Business Unit': 'Product Owner UK Bureau Team', Date: initialDate },
  { id: '2', Reviewer: 'Suranjita Saha', 'Role or Business Unit': 'CU Team Lead', Date: initialDate },
  { id: '3', Reviewer: 'Manash R Chanda', 'Role or Business Unit': 'UKBI Design Manager', Date: initialDate },
];

function sanitizeParties(parties?: any[]) {
  if (
    !Array.isArray(parties) ||
    parties.length === 0 ||
    parties.some((p: any) => p.Name === '[Name]' || (p.Name && p.Name.includes('[')) || p.Role === 'Lead Business Analyst' || p.Role === 'ETL Engineering Lead' || p['Business Unit'])
  ) {
    return JSON.parse(JSON.stringify(STATIC_INVOLVED_PARTIES));
  }
  return parties;
}

function sanitizeReviewedBy(reviewed?: any[]) {
  if (
    !Array.isArray(reviewed) ||
    reviewed.length === 0 ||
    reviewed.some((r: any) => r.Reviewer === '[Name]' || (r.Reviewer && r.Reviewer.includes('[')) || r['Role or Business Unit'] === 'Lead BA Reviewer' || r['Role or Business Unit'] === 'Enterprise Architect')
  ) {
    return JSON.parse(JSON.stringify(STATIC_REVIEWED_BY));
  }
  return reviewed;
}

let hldProjectsStore: HldProject[] = [
  {
    id: 'proj-alpha',
    projectName: 'CRA Project Alpha — CAIS 2026',
    targetBrand: 'HSBC Cards (51)',
    targetBrands: ['HSBC Cards (51)'],
    targetProducts: ['05 — Credit Card'],
    targetDate: 'December 2026',
    createdAt: new Date().toISOString(),
  },
];

const defaultAlphaSections = JSON.parse(JSON.stringify(BLANK_SECTIONS));
const sec4Master = MASTER_SECTIONS.find((s: any) => s.sectionNumber === '4.0' || s.id === 'sec-4-0');
if (sec4Master) {
  const alphaSec4Idx = defaultAlphaSections.findIndex((s: any) => s.sectionNumber === '4.0' || s.id === 'sec-4-0');
  if (alphaSec4Idx !== -1) {
    defaultAlphaSections[alphaSec4Idx] = JSON.parse(JSON.stringify(sec4Master));
  }
}

// In-memory sections store per project ID (starts BLANK until Create New HLD is run with consent)
let projectSectionsStore: Record<string, any[]> = {
  'proj-alpha': defaultAlphaSections,
};

// In-memory section reviews per project ID
let projectReviewsStore: Record<string, Record<string, any>> = {
  'proj-alpha': {},
};

// In-memory Document Information metadata store per project ID
let projectMetadataStore: Record<string, {
  coverDetails?: any;
  interestedParties?: any[];
  revisionHistory?: any[];
  reviewedBy?: any[];
}> = {
  'proj-alpha': {
    coverDetails: {
      title: 'CRA CAIS Reporting High Level Design',
      subtitle: 'High Level Design — Consolidated Document',
      author: 'Aishwarya Raj Singh',
      date: initialDate,
      version: '1.0',
    },
    interestedParties: JSON.parse(JSON.stringify(STATIC_INVOLVED_PARTIES)),
    revisionHistory: [
      { id: '1', Version: '1.0', Date: initialDate, 'Updated By': 'Aishwarya Raj Singh', 'Reason for Issue': 'Initial consolidated HLD created' },
    ],
    reviewedBy: JSON.parse(JSON.stringify(STATIC_REVIEWED_BY)),
  },
};

export async function GET(req: NextRequest) {
  try {
    const cloud = await getCloudProjects();
    if (cloud && cloud.projects && cloud.projects.length > 0) {
      const existingIds = new Set(hldProjectsStore.map((p) => p.id));
      cloud.projects.forEach((cp: any) => {
        if (!existingIds.has(cp.id)) {
          hldProjectsStore.push(cp);
        }
      });
      if (cloud.projectSections) Object.assign(projectSectionsStore, cloud.projectSections);
      if (cloud.projectMetadata) Object.assign(projectMetadataStore, cloud.projectMetadata);
    }
  } catch (e) {}

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  if (projectId) {
    const proj = hldProjectsStore.find((p) => p.id === projectId);
    let sections = projectSectionsStore[projectId] || JSON.parse(JSON.stringify(BLANK_SECTIONS));
    const hasSec4 = sections.some((s: any) => s.sectionNumber === '4.0' || s.id === 'sec-4-0');
    if (!hasSec4) {
      const fallbackSec4 = BLANK_SECTIONS.find((s: any) => s.sectionNumber === '4.0' || s.id === 'sec-4-0');
      if (fallbackSec4) {
        sections = [...sections, JSON.parse(JSON.stringify(fallbackSec4))];
      }
    }
    const reviews = projectReviewsStore[projectId] || {};
    const todayStr = getTodayFormatted();

    let metadata = projectMetadataStore[projectId];

    // Guarantee the v48 hardcoded roster is returned for proj-alpha or uncustomized placeholder data
    if (!metadata || projectId === 'proj-alpha') {
      metadata = {
        coverDetails: {
          title: proj?.projectName || 'CRA CAIS Reporting High Level Design',
          subtitle: `High Level Design — ${proj?.targetBrand || 'Consolidated Document'}`,
          author: 'Aishwarya Raj Singh',
          date: todayStr,
          version: '1.0',
        },
        interestedParties: JSON.parse(JSON.stringify(STATIC_INVOLVED_PARTIES)),
        revisionHistory: [
          { id: '1', Version: '1.0', Date: todayStr, 'Updated By': 'Aishwarya Raj Singh', 'Reason for Issue': 'Initial consolidated HLD created' },
        ],
        reviewedBy: JSON.parse(JSON.stringify(STATIC_REVIEWED_BY)),
      };
      projectMetadataStore[projectId] = metadata;
    }

    metadata.interestedParties = sanitizeParties(metadata.interestedParties);
    metadata.reviewedBy = sanitizeReviewedBy(metadata.reviewedBy);

    return NextResponse.json({ project: proj, sections, reviews, metadata, commitVersion: 'v51-hardcoded-roster-12345' });
  }

  return NextResponse.json({ projects: hldProjectsStore });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectName, targetBrand, targetBrands, targetProducts, targetDate, strategy, selectedSectionNums, sourceProjectId, sourceInvolvedParties, sourceReviewedBy } = body;

    if (!projectName || !projectName.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const brandList = Array.isArray(targetBrands) && targetBrands.length > 0 ? targetBrands : (targetBrand ? [targetBrand] : ['HSBC Cards (51)']);
    const productList = Array.isArray(targetProducts) && targetProducts.length > 0 ? targetProducts : ['05 — Credit Card'];

    const newId = `proj-${crypto.randomUUID()}`;
    const newProject: HldProject = {
      id: newId,
      projectName: projectName.trim(),
      targetBrand: brandList.join(', '),
      targetBrands: brandList,
      targetProducts: productList,
      targetDate: targetDate || 'December 2026',
      createdAt: new Date().toISOString(),
    };

    hldProjectsStore.push(newProject);

    // Populate sections according to strategy
    // If user selected COPY_ALL, copy sections from the active source project (or MASTER_SECTIONS as baseline fallback)
    const sourceSections = (sourceProjectId && projectSectionsStore[sourceProjectId])
      ? projectSectionsStore[sourceProjectId]
      : MASTER_SECTIONS;
    const blankShellSections = BLANK_SECTIONS;

    let newSections: any[] = [];

    if (strategy === 'COPY_ALL') {
      newSections = JSON.parse(JSON.stringify(sourceSections));
    } else if (strategy === 'CHOOSE_SECTIONS') {
      const allowedNums: string[] = selectedSectionNums || [];
      newSections = sourceSections.map((sec: any) => {
        const isSelected = allowedNums.includes(sec.sectionNumber) || 
          (sec.sectionNumber === '4.0' && (allowedNums.includes('4.0') || allowedNums.includes('4.1') || allowedNums.includes('4.2')));
        if (isSelected) {
          return JSON.parse(JSON.stringify(sec));
        } else {
          return {
            ...JSON.parse(JSON.stringify(sec)),
            subSections: sec.subSections.map((sub: any) => ({
              id: `sub-blank-${sub.id}`,
              documentSectionId: sec.id,
              heading: sub.heading,
              displayOrder: sub.displayOrder,
              contentBlocks: JSON.stringify([
                { type: 'paragraph', payload: { text: '[No content written yet for this section]' } }
              ]),
              lastUpdatedById: 'user-ba',
              versions: [],
            })),
          };
        }
      });
    } else {
      // START_BLANK
      newSections = JSON.parse(JSON.stringify(blankShellSections));
    }

    const todayStr = getTodayFormatted();
    const sourceMeta = projectMetadataStore[sourceProjectId || 'proj-alpha'];

    const carryOverParties = Array.isArray(sourceInvolvedParties) && sourceInvolvedParties.length > 0
      ? sourceInvolvedParties
      : (sourceMeta?.interestedParties || STATIC_INVOLVED_PARTIES);

    const carryOverReviewedBy = Array.isArray(sourceReviewedBy) && sourceReviewedBy.length > 0
      ? sourceReviewedBy
      : (sourceMeta?.reviewedBy || STATIC_REVIEWED_BY);

    const newMetadata = {
      coverDetails: {
        title: projectName.trim(),
        subtitle: `High Level Design — ${brandList.join(', ')}`,
        author: 'Aishwarya Raj Singh',
        date: todayStr,
        version: '1.0',
      },
      interestedParties: JSON.parse(JSON.stringify(carryOverParties)),
      revisionHistory: [
        {
          id: '1',
          Version: '1.0',
          Date: todayStr,
          'Updated By': 'Aishwarya Raj Singh',
          'Reason for Issue': 'Initial consolidated HLD created',
        },
      ],
      reviewedBy: JSON.parse(JSON.stringify(carryOverReviewedBy)),
    };

    projectSectionsStore[newId] = newSections;
    projectReviewsStore[newId] = {};
    projectMetadataStore[newId] = newMetadata;

    await saveCloudProject(newProject, newSections, newMetadata);

    return NextResponse.json({ success: true, project: newProject, sections: newSections, metadata: newMetadata });
  } catch (error: any) {
    console.error('Create HLD project error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, coverDetails, interestedParties, revisionHistory, reviewedBy } = body;
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }
    const current = projectMetadataStore[projectId] || {};
    projectMetadataStore[projectId] = {
      ...current,
      coverDetails: coverDetails || current.coverDetails,
      interestedParties: interestedParties || current.interestedParties,
      revisionHistory: revisionHistory || current.revisionHistory,
      reviewedBy: reviewedBy || current.reviewedBy,
    };
    return NextResponse.json({ success: true, metadata: projectMetadataStore[projectId] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || searchParams.get('id');
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }
    if (projectId === 'proj-alpha') {
      return NextResponse.json({ error: 'Cannot delete baseline project proj-alpha' }, { status: 400 });
    }

    hldProjectsStore = hldProjectsStore.filter((p) => p.id !== projectId);
    delete projectSectionsStore[projectId];
    delete projectReviewsStore[projectId];
    delete projectMetadataStore[projectId];

    await deleteCloudProject(projectId);

    return NextResponse.json({ success: true, deletedId: projectId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export function getProjectSections(projectId: string) {
  return projectSectionsStore[projectId] || projectSectionsStore['proj-alpha'];
}

export function setProjectSections(projectId: string, sections: any[]) {
  projectSectionsStore[projectId] = sections;
}

export function getProjectReviews(projectId: string) {
  return projectReviewsStore[projectId] || {};
}

export function setProjectReviews(projectId: string, reviews: Record<string, any>) {
  projectReviewsStore[projectId] = reviews;
}
