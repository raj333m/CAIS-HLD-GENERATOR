import { NextRequest, NextResponse } from 'next/server';
import { MASTER_SECTIONS, BLANK_SECTIONS } from '@/lib/sectionsData';

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
  { id: '1', Reviewer: 'Stuart H Lindsay', 'Role or Business Unit': 'Product Owner UK Bureau', Date: initialDate },
  { id: '2', Reviewer: 'Suranjita Saha', 'Role or Business Unit': 'CU Team Lead', Date: initialDate },
  { id: '3', Reviewer: 'Manash R Chanda', 'Role or Business Unit': 'UKBI Design Manager', Date: initialDate },
];

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

// In-memory sections store per project ID (starts BLANK until Create New HLD is run with consent)
let projectSectionsStore: Record<string, any[]> = {
  'proj-alpha': JSON.parse(JSON.stringify(BLANK_SECTIONS)),
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
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  if (projectId) {
    const proj = hldProjectsStore.find((p) => p.id === projectId);
    const sections = projectSectionsStore[projectId] || JSON.parse(JSON.stringify(BLANK_SECTIONS));
    const reviews = projectReviewsStore[projectId] || {};
    const todayStr = getTodayFormatted();
    const metadata = projectMetadataStore[projectId] || {
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
    return NextResponse.json({ project: proj, sections, reviews, metadata });
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

    const newId = `proj-${Date.now()}`;
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
    // If user selected COPY_ALL (Pre-populated baseline with user consent), use MASTER_SECTIONS
    const baselineSections = MASTER_SECTIONS;
    const blankShellSections = BLANK_SECTIONS;

    let newSections: any[] = [];

    if (strategy === 'COPY_ALL') {
      newSections = JSON.parse(JSON.stringify(baselineSections));
    } else if (strategy === 'CHOOSE_SECTIONS') {
      const allowedNums: string[] = selectedSectionNums || [];
      newSections = baselineSections.map((sec: any) => {
        if (allowedNums.includes(sec.sectionNumber)) {
          return JSON.parse(JSON.stringify(sec));
        } else {
          return {
            ...JSON.parse(JSON.stringify(sec)),
            subSections: [
              {
                id: `sub-blank-${sec.sectionNumber}`,
                heading: 'Content Pending',
                contentBlocks: JSON.stringify([{ type: 'paragraph', payload: { text: '[Content pending specification for this section]' } }]),
              },
            ],
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
