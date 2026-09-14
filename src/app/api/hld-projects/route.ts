import { NextRequest, NextResponse } from 'next/server';
import { MASTER_SECTIONS } from '@/lib/sectionsData';

export interface HldProject {
  id: string;
  projectName: string;
  targetBrand: string;
  targetDate: string;
  createdAt: string;
  sections?: any[];
}

let hldProjectsStore: HldProject[] = [
  {
    id: 'proj-alpha',
    projectName: 'CRA Project Alpha — CAIS 2026',
    targetBrand: 'HSBC Cards',
    targetDate: 'December 2026',
    createdAt: new Date().toISOString(),
  },
];

// In-memory sections store per project ID
let projectSectionsStore: Record<string, any[]> = {
  'proj-alpha': JSON.parse(JSON.stringify(MASTER_SECTIONS)),
};

// In-memory section reviews per project ID
let projectReviewsStore: Record<string, Record<string, any>> = {
  'proj-alpha': {},
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  if (projectId) {
    const proj = hldProjectsStore.find((p) => p.id === projectId);
    const sections = projectSectionsStore[projectId] || JSON.parse(JSON.stringify(MASTER_SECTIONS));
    const reviews = projectReviewsStore[projectId] || {};
    return NextResponse.json({ project: proj, sections, reviews });
  }

  return NextResponse.json({ projects: hldProjectsStore });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectName, targetBrand, targetDate, strategy, selectedSectionNums, sourceProjectId } = body;

    if (!projectName || !projectName.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const newId = `proj-${Date.now()}`;
    const newProject: HldProject = {
      id: newId,
      projectName: projectName.trim(),
      targetBrand: targetBrand || 'HSBC Cards',
      targetDate: targetDate || 'December 2026',
      createdAt: new Date().toISOString(),
    };

    hldProjectsStore.push(newProject);

    // Populate sections according to strategy
    const sourceSections = projectSectionsStore[sourceProjectId || 'proj-alpha'] || MASTER_SECTIONS;

    let newSections: any[] = [];

    if (strategy === 'COPY_ALL') {
      newSections = JSON.parse(JSON.stringify(sourceSections));
    } else if (strategy === 'CHOOSE_SECTIONS') {
      const allowedNums: string[] = selectedSectionNums || [];
      newSections = sourceSections.map((sec: any) => {
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
      newSections = sourceSections.map((sec: any) => ({
        ...JSON.parse(JSON.stringify(sec)),
        subSections: [
          {
            id: `sub-blank-${sec.sectionNumber}`,
            heading: 'Section Overview',
            contentBlocks: JSON.stringify([{ type: 'paragraph', payload: { text: '[New project section shell - add sub-headings and text]' } }]),
          },
        ],
      }));
    }

    projectSectionsStore[newId] = newSections;
    projectReviewsStore[newId] = {};

    return NextResponse.json({ success: true, project: newProject, sections: newSections });
  } catch (error: any) {
    console.error('Create HLD project error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: 500 });
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
