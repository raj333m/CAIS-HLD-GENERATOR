import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCloudChangeState, deletedIds, saveCreatedChange, getCreatedChanges, getMergedChanges } from '@/lib/cloudStore';

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
    impactedBureaus: 'HSBC Cards (51), First Direct (211), M&S Loans (947), HSBC Retail (85), M&S Current Accounts (662)',
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
    impactedBureaus: 'HSBC Cards (51), First Direct (211), M&S Loans (947), HSBC Retail (85), M&S Current Accounts (662)',
    impactedDataItems: '11. Account Type, 36. Credit Limit / Total Loan Amount',
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
    impactedBureaus: 'HSBC Cards (51), First Direct (211), M&S Loans (947), HSBC Retail (85), M&S Current Accounts (662)',
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
    const projectId = searchParams.get('projectId');

    let changes = await getMergedChanges(prisma, PREPOPULATED_CHANGES);

    if (projectId) {
      changes = changes.filter((c: any) => (c.projectId || 'proj-alpha') === projectId);
    }

    if (search) {
      const s = search.toLowerCase();
      changes = changes.filter(
        (c: any) =>
          c.title?.toLowerCase().includes(s) ||
          c.crReference?.toLowerCase().includes(s) ||
          c.businessDriver?.toLowerCase().includes(s) ||
          c.description?.toLowerCase().includes(s)
      );
    }

    if (status) {
      changes = changes.filter((c: any) => c.status === status);
    }

    if (bureau) {
      changes = changes.filter((c: any) => c.impactedBureaus?.includes(bureau));
    }

    if (changeType) {
      changes = changes.filter((c: any) => c.changeType?.includes(changeType));
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

    const targetProjectId = body.projectId || 'proj-alpha';

    // Handle batch creation of multiple changes
    if (Array.isArray(body.changes)) {
      const createdList = [];
      for (const item of body.changes) {
        const authorId = item.userId || body.userId || defaultBa?.id || 'ba-demo-user-id';
        if (!item.title || !item.crReference) continue;
        const itemProjectId = item.projectId || targetProjectId;

        let createdItem: any = null;
        try {
          createdItem = await prisma.caisChange.create({
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
              impactedBureaus: Array.isArray(item.impactedBureaus) ? item.impactedBureaus.join(', ') : item.impactedBureaus || 'HSBC Cards (51), First Direct (211), M&S Loans (947), HSBC Retail (85), M&S Current Accounts (662)',
              impactedDataItems: Array.isArray(item.impactedDataItems) ? item.impactedDataItems.join(', ') : item.impactedDataItems || '',
              targetMonth: item.targetMonth || 'November 2026',
              createdById: authorId,
              hldDocumentId: itemProjectId,
            },
          });
        } catch (e) {
          // Fallback if DB is read-only
          createdItem = {
            id: `change-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            title: item.title,
            crReference: item.crReference,
            status: item.status || 'DRAFT',
            changeType: item.changeType || 'Existing data item amended',
            businessDriver: item.businessDriver || 'CAIS Regulatory Requirement',
            description: item.description || '',
            sectionsUpdated: item.sectionsUpdated || '1.3',
            impactedBureaus: item.impactedBureaus || 'HSBC Cards (51), First Direct (211), M&S Loans (947), HSBC Retail (85), M&S Current Accounts (662)',
            targetMonth: item.targetMonth || 'November 2026',
            createdAt: new Date().toISOString(),
          };
        }
        createdItem.projectId = itemProjectId;
        createdItem.hldDocumentId = itemProjectId;
        await saveCreatedChange(createdItem);
        createdList.push(createdItem);
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
      const newChange: any = await prisma.caisChange.create({
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
          impactedBureaus: Array.isArray(impactedBureaus) ? impactedBureaus.join(', ') : impactedBureaus || 'HSBC Cards (51), First Direct (211), M&S Loans (947), HSBC Retail (85), M&S Current Accounts (662)',
          impactedDataItems: Array.isArray(impactedDataItems) ? impactedDataItems.join(', ') : impactedDataItems || '',
          targetMonth: targetMonth || 'November 2026',
          createdById: authorId,
          hldDocumentId: targetProjectId,
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
      newChange.projectId = targetProjectId;
      newChange.hldDocumentId = targetProjectId;
      await saveCreatedChange(newChange);
      return NextResponse.json({ change: newChange }, { status: 201 });
    } catch (dbErr: any) {
      console.error('[Prisma Error in POST /api/changes]:', dbErr?.message || dbErr);
      const mockChange = {
        id: crypto.randomUUID(),
        title,
        crReference,
        status: body.status || 'DRAFT',
        changeType: Array.isArray(changeType) ? changeType.join(', ') : changeType || 'Existing data item amended',
        businessDriver: businessDriver || 'CAIS Regulatory Requirement',
        description: description || '',
        beforeText: beforeText || '',
        afterText: afterText || '',
        sectionsUpdated: Array.isArray(sectionsUpdated) ? sectionsUpdated.join(', ') : sectionsUpdated || '1.3',
        impactedBureaus: Array.isArray(impactedBureaus) ? impactedBureaus.join(', ') : impactedBureaus || 'HSBC Cards (51), First Direct (211), M&S Loans (947), HSBC Retail (85), M&S Current Accounts (662)',
        impactedDataItems: Array.isArray(impactedDataItems) ? impactedDataItems.join(', ') : impactedDataItems || '',
        targetMonth: targetMonth || 'November 2026',
        author: 'Aishwarya Raj Singh',
        projectId: targetProjectId,
        hldDocumentId: targetProjectId,
        createdAt: new Date().toISOString(),
      };
      await saveCreatedChange(mockChange);
      console.log('[POST /api/changes] Successfully created persistent change record with UUID:', mockChange.id, 'for project:', targetProjectId);
      return NextResponse.json({ change: mockChange }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error creating change:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
