import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCloudChangeState } from '@/lib/cloudStore';

const prisma = new PrismaClient();

export const PREPOPULATED_CHANGES = [
  {
    id: 'change-cais-2026-003',
    crReference: 'CAIS-2026-003',
    title: 'Default Balance Reconciliation & Account Closure Date Alignment',
    status: 'DRAFT',
    changeType: 'Existing data item amended, Business rule change',
    businessDriver: 'Internal data quality remediation — align Original Default Balance and Default Satisfaction Date fields for accounts sold to debt collection agencies so default balances remain accurate post-sale.',
    description: 'Align the Original Default Balance and Default Satisfaction Date fields for accounts sold to debt collection agencies to ensure default balances are correctly reflected once an account is transferred.',
    sectionsUpdated: 'Section 1.3 — Exclusion Rules Applied Post-Staging (All Brands); Section 2.5 — CAIS Variables 17 (Original Default Balance) and 42 (Default Satisfaction Date).',
    beforeText: '[Describe prior logic for Original Default Balance / Default Satisfaction Date on debt-sold accounts]',
    afterText: '[Describe corrected logic once implemented]',
    impactedBureaus: 'HSBC Cards (51), First Direct Cards (211)',
    impactedDataItems: '17. Original Default Balance, 42. Default Satisfaction Date',
    targetMonth: 'December 2026',
    creationDate: '2026-09-12',
    submissionDate: null,
    approvalDate: null,
    versionNumber: 1,
    reviewedByName: null,
    hldProjectName: 'UK CAIS Regulatory Reporting',
    createdBy: { id: 'ba-demo-user-id', name: 'Business Analyst (Author)', email: 'ba@cais.com', role: 'BA' },
    createdAt: '2026-09-12T10:00:00.000Z',
    updatedAt: '2026-09-12T10:00:00.000Z',
    risks: [],
  },
  {
    id: 'change-cais-2026-002',
    crReference: 'CAIS-2026-002',
    title: 'Buy-Now-Pay-Later (BNPL) Product Scope Expansion to CAIS',
    status: 'IN_REVIEW',
    changeType: 'New product type, New data item added, Technical schema change',
    businessDriver: 'Bring the new BNPL instalment product into scope in line with expanding regulatory expectations on BNPL data sharing.',
    description: 'Incorporate new BNPL installment product line into monthly CAIS reporting files submitted to Experian, Equifax, and TransUnion.',
    sectionsUpdated: 'Section 1.3 — New BNPL inclusion sub-section; Section 2.5 — Supported Products table',
    beforeText: 'BNPL products were out of scope for monthly CAIS reporting.',
    afterText: 'BNPL products mapped to CAIS Product Code "BN" with 3-installment reporting logic active across staging pipeline.',
    impactedBureaus: 'HSBC Retail (85), HSBC Cards (51), First Direct (211)',
    impactedDataItems: '02. Account Type, 09. Credit Limit / Total Loan Amount',
    targetMonth: 'November 2026',
    creationDate: '2026-09-11',
    submissionDate: '2026-09-12',
    approvalDate: null,
    versionNumber: 1,
    reviewedByName: 'Reviewer / Lead',
    hldProjectName: 'UK CAIS Regulatory Reporting',
    createdBy: { id: 'ba-demo-user-id', name: 'Business Analyst (Author)', email: 'ba@cais.com', role: 'BA' },
    reviewedBy: { id: 'reviewer-demo-user-id', name: 'Reviewer / Lead', email: 'reviewer@cais.com', role: 'REVIEWER' },
    reviewComments: 'Under review by Risk Committee.',
    createdAt: '2026-09-11T14:00:00.000Z',
    updatedAt: '2026-09-11T14:00:00.000Z',
    risks: [
      { id: 'risk-1', risk: 'Legacy SAS batch processing timeout during window', impact: 'Medium', mitigation: 'Parallel pre-cutover test on staging DB' }
    ],
  },
  {
    id: 'change-cais-2026-001',
    crReference: 'CAIS-2026-001',
    title: 'Consumer Duty Payment Holiday & Forbearance Indicator Update',
    status: 'APPROVED',
    changeType: 'Existing data item amended, Business rule change, Bureau variation',
    businessDriver: 'Accurately flag temporary forbearance/payment holidays in support of Consumer Duty.',
    description: 'Enhance monthly reporting to flag temporary forbearance payment holidays accurately across all 3 bureaus, preventing erroneous arrears scoring for impacted customers.',
    sectionsUpdated: 'Section 1.3 — Status criteria; Section 2.5 — CAIS Variable 19 (Special Instruction Indicator)',
    beforeText: 'ARR_INDICATOR only supported "I" (Formal Plan) and "N" (None). Payment holiday accounts were reported with status increments.',
    afterText: 'ARR_INDICATOR now supports "P" (Payment Holiday) with STATUS_CODE held at "0" (Up to Date) during active arrangement period.',
    impactedBureaus: 'HSBC Retail (85), HSBC Cards (51), M&S Loans (947), First Direct (211)',
    impactedDataItems: '19. Special Instruction Indicator, 05. Account Status',
    targetMonth: 'October 2026',
    creationDate: '2026-09-08',
    submissionDate: '2026-09-09',
    approvalDate: '2026-09-10',
    versionNumber: 1,
    reviewedByName: 'Lead Reviewer',
    hldProjectName: 'UK CAIS Regulatory Reporting',
    createdBy: { id: 'ba-demo-user-id', name: 'Business Analyst (Author)', email: 'ba@cais.com', role: 'BA' },
    reviewedBy: { id: 'reviewer-demo-user-id', name: 'Reviewer / Lead', email: 'reviewer@cais.com', role: 'REVIEWER' },
    reviewComments: 'Approved by Lead Reviewer. Fully compliant with CAIS data standard.',
    approvedAt: '2026-09-10T14:30:00.000Z',
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T14:30:00.000Z',
    risks: [],
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

    // Enrich changes with CloudStore persisted state & filter deleted changes
    const enrichedChanges = await Promise.all(
      changes.map(async (c: any) => {
        try {
          const cloudState = await getCloudChangeState(c.crReference || c.id);
          if (cloudState) {
            if (cloudState.deleted) return null;
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
      return NextResponse.json({ change: mockChange }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error creating change:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
