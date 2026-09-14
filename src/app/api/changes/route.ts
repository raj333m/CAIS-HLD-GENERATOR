import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCloudChangeState, deletedIds, saveCreatedChange, getCreatedChanges } from '@/lib/cloudStore';

const prisma = new PrismaClient();

export const PREPOPULATED_CHANGES: any[] = [
  {
    id: '37eda0d7-1c69-40f4-94ff-452c6141b56a',
    crReference: 'CAIS-2026-001',
    title: 'Consumer Duty Payment Holiday & Forbearance Indicator Update',
    status: 'APPROVED',
    changeType: 'Existing data item amended, Business rule change, Bureau variation',
    businessDriver: 'Accurately flag temporary forbearance/payment holidays in support of Consumer Duty.',
    description: 'Enhance monthly reporting to flag temporary forbearance payment holidays accurately across all 3 bureaus, preventing erroneous arrears scoring for impacted customers.',
    sectionsUpdated: '1.3, 2.5',
    impactedBureaus: 'Experian, Equifax, TransUnion',
    impactedDataItems: '19. Special Instruction Indicator, 05. Account Status',
    targetMonth: 'October 2026',
    author: 'Aishwarya Raj Singh',
    createdAt: '2026-09-10T14:30:00.000Z',
  },
  {
    id: 'b82df910-449e-4e63-8a3e-721fb653ab12',
    crReference: 'CAIS-2026-002',
    title: 'Buy-Now-Pay-Later (BNPL) Product Scope Expansion to CAIS',
    status: 'IN_REVIEW',
    changeType: 'New product type, New data item added, Technical schema change',
    businessDriver: 'Bring the new BNPL instalment product into scope in line with expanding regulatory expectations on BNPL data sharing.',
    description: 'Incorporate new BNPL installment product line into monthly CAIS reporting files submitted to Experian, Equifax, and TransUnion.',
    sectionsUpdated: '1.3, 2.5',
    impactedBureaus: 'Experian, Equifax, TransUnion',
    impactedDataItems: '02. Account Type, 09. Credit Limit / Total Loan Amount',
    targetMonth: 'November 2026',
    author: 'Aishwarya Raj Singh',
    createdAt: '2026-09-12T10:15:00.000Z',
  },
  {
    id: 'f9411d38-2e02-4740-9a29-158a1834279b',
    crReference: 'CAIS-2026-003',
    title: 'Default Balance Reconciliation & Account Closure Date Alignment',
    status: 'DRAFT',
    changeType: 'Existing data item amended, Business rule change',
    businessDriver: 'Internal data quality remediation — align Original Default Balance and Default Satisfaction Date fields for accounts sold to debt collection agencies so default balances remain accurate post-sale.',
    description: 'Align the Original Default Balance and Default Satisfaction Date fields for accounts sold to debt collection agencies to ensure default balances are correctly reflected once an account is transferred.',
    sectionsUpdated: '1.3, 2.5',
    impactedBureaus: 'Experian, Equifax, TransUnion',
    impactedDataItems: '17. Original Default Balance, 42. Default Satisfaction Date',
    targetMonth: 'December 2026',
    author: 'Aishwarya Raj Singh',
    createdAt: '2026-09-13T09:00:00.000Z',
  },
];

// GET /api/changes - List Section 3 Change Register entries (newest first)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const bureau = searchParams.get('bureau') || '';
    const changeType = searchParams.get('changeType') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { crReference: { contains: search } },
        { businessDriver: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (bureau) {
      where.impactedBureaus = { contains: bureau };
    }

    if (changeType) {
      where.changeType = { contains: changeType };
    }

    let changes: any[] = [];
    try {
      changes = await prisma.caisChange.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          reviewedBy: { select: { id: true, name: true, email: true, role: true } },
          risks: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbError) {
      console.warn('Prisma lookup failed in GET /api/changes:', dbError);
    }

    // Fallback to pre-populated changes if DB returns empty
    if (changes.length === 0) {
      let filtered = PREPOPULATED_CHANGES;
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(c => c.title.toLowerCase().includes(s) || c.crReference.toLowerCase().includes(s) || c.description.toLowerCase().includes(s));
      }
      if (bureau) {
        filtered = filtered.filter(c => c.impactedBureaus.includes(bureau));
      }
      if (changeType) {
        filtered = filtered.filter(c => c.changeType.includes(changeType));
      }
      changes = filtered;
    }

    // Merge cloud persisted created changes
    try {
      const cloudCreated = await getCreatedChanges();
      if (cloudCreated.length > 0) {
        const existingRefs = new Set(changes.map((c: any) => c.crReference));
        const newItems = cloudCreated.filter((c: any) => !existingRefs.has(c.crReference));
        changes = [...newItems, ...changes];
      }
    } catch (e) {}

    // Enrich changes with CloudStore persisted state & filter deleted changes
    const enrichedChanges = await Promise.all(
      changes.map(async (c: any) => {
        try {
          const cloudStateByRef = c.crReference ? await getCloudChangeState(c.crReference) : null;
          const cloudStateById = c.id ? await getCloudChangeState(c.id) : null;
          const isDeleted = (cloudStateByRef && cloudStateByRef.deleted) || (cloudStateById && cloudStateById.deleted) || deletedIds.has(c.id) || deletedIds.has(c.crReference);
          
          if (isDeleted) return null;

          const cloudState = cloudStateByRef || cloudStateById;
          if (cloudState) {
            return {
              ...c,
              status: cloudState.status || c.status,
              versionNumber: cloudState.versionNumber || c.versionNumber,
              reviewComments: cloudState.reviewComments || c.reviewComments,
              reviewedByName: cloudState.reviewedByName || c.reviewedByName,
              approvalDate: cloudState.approvalDate || c.approvalDate,
            };
          }
        } catch (e) {}
        return c;
      })
    );

    changes = enrichedChanges.filter(Boolean);

    const projectId = searchParams.get('projectId');
    if (projectId && projectId !== 'proj-alpha') {
      changes = changes.filter((c: any) => c.projectId === projectId);
    }

    if (status) {
      changes = changes.filter((c: any) => c.status === status);
    }

    return NextResponse.json({ changes });
  } catch (error: any) {
    console.error('Error fetching changes:', error);
    return NextResponse.json({ changes: PREPOPULATED_CHANGES });
  }
}

// POST /api/changes - Create one or multiple CAIS change intake entries
export async function POST(request: Request) {
  try {
    const body = await request.json();
    let defaultBa: any = null;
    try {
      defaultBa = await prisma.user.findFirst({ where: { role: 'BA' } });
    } catch (e) {}

    // Handle batch creation of multiple changes
    if (Array.isArray(body.changes)) {
      const createdList = [];
      for (const item of body.changes) {
        const authorId = item.userId || body.userId || defaultBa?.id || 'ba-demo-user-id';
        if (!item.title || !item.crReference) continue;

        try {
          const newChange = await prisma.caisChange.create({
            data: {
              title: item.title,
              crReference: item.crReference,
              status: item.status || 'DRAFT',
              changeType: Array.isArray(item.changeType) ? item.changeType.join(', ') : item.changeType || 'Existing data item amended',
              businessDriver: item.businessDriver || 'CAIS Regulatory Requirement',
              description: item.description || '',
              beforeText: item.beforeText || '',
              afterText: item.afterText || '',
              sectionsUpdated: Array.isArray(item.sectionsUpdated) ? item.sectionsUpdated.join(', ') : item.sectionsUpdated || '1.3',
              impactedBureaus: Array.isArray(item.impactedBureaus) ? item.impactedBureaus.join(', ') : item.impactedBureaus || 'Experian, Equifax, TransUnion',
              impactedDataItems: Array.isArray(item.impactedDataItems) ? item.impactedDataItems.join(', ') : item.impactedDataItems || '',
              targetMonth: item.targetMonth || 'November 2026',
              createdById: authorId,
            },
          });
          createdList.push(newChange);
        } catch (e) {
          // Fallback if DB is read-only
          createdList.push({
            id: `change-${Date.now()}`,
            title: item.title,
            crReference: item.crReference,
            status: item.status || 'DRAFT',
            changeType: item.changeType || 'Existing data item amended',
            businessDriver: item.businessDriver || 'CAIS Regulatory Requirement',
            description: item.description || '',
            sectionsUpdated: item.sectionsUpdated || '1.3',
            impactedBureaus: item.impactedBureaus || 'Experian, Equifax, TransUnion',
            targetMonth: item.targetMonth || 'November 2026',
            createdAt: new Date().toISOString(),
          });
        }
      }
      return NextResponse.json({ changes: createdList }, { status: 201 });
    }

    // Single change creation fallback
    const {
      title,
      crReference,
      changeType,
      businessDriver,
      description,
      beforeText,
      afterText,
      sectionsUpdated,
      impactedBureaus,
      impactedDataItems,
      targetMonth,
      userId,
      risks = [],
    } = body;

    if (!title || !crReference) {
      return NextResponse.json({ error: 'Title and Change Reference are required' }, { status: 400 });
    }

    const authorId = userId || defaultBa?.id || 'ba-demo-user-id';

    try {
      const newChange = await prisma.caisChange.create({
        data: {
          title,
          crReference,
          status: body.status || 'DRAFT',
          changeType: Array.isArray(changeType) ? changeType.join(', ') : changeType || 'Existing data item amended',
          businessDriver: businessDriver || 'CAIS Regulatory Requirement',
          description: description || '',
          beforeText: beforeText || '',
          afterText: afterText || '',
          sectionsUpdated: Array.isArray(sectionsUpdated) ? sectionsUpdated.join(', ') : sectionsUpdated || '1.3',
          impactedBureaus: Array.isArray(impactedBureaus) ? impactedBureaus.join(', ') : impactedBureaus || 'Experian, Equifax, TransUnion',
          impactedDataItems: Array.isArray(impactedDataItems) ? impactedDataItems.join(', ') : impactedDataItems || '',
          targetMonth: targetMonth || 'November 2026',
          createdById: authorId,
          risks: {
            create: risks.map((r: any) => ({
              risk: r.risk || 'General operational deployment risk',
              impact: r.impact || 'Medium',
              mitigation: r.mitigation || 'Staging dry run prior to cutover',
            })),
          },
        },
        include: {
          createdBy: true,
          risks: true,
        },
      });
      await saveCreatedChange(newChange);
      return NextResponse.json({ change: newChange }, { status: 201 });
    } catch (dbErr) {
      const mockChange = {
        id: `change-${Date.now()}`,
        title,
        crReference,
        status: body.status || 'DRAFT',
        changeType: Array.isArray(changeType) ? changeType.join(', ') : changeType || 'Existing data item amended',
        businessDriver: businessDriver || 'CAIS Regulatory Requirement',
        description: description || '',
        beforeText: beforeText || '',
        afterText: afterText || '',
        sectionsUpdated: Array.isArray(sectionsUpdated) ? sectionsUpdated.join(', ') : sectionsUpdated || '1.3',
        impactedBureaus: Array.isArray(impactedBureaus) ? impactedBureaus.join(', ') : impactedBureaus || 'Experian, Equifax, TransUnion',
        targetMonth: targetMonth || 'November 2026',
        createdAt: new Date().toISOString(),
      };
      await saveCreatedChange(mockChange);
      return NextResponse.json({ change: mockChange }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error creating change:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
