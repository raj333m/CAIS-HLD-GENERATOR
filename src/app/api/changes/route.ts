import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    const changes = await prisma.caisChange.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        reviewedBy: { select: { id: true, name: true, email: true, role: true } },
        risks: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ changes });
  } catch (error: any) {
    console.error('Error fetching changes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/changes - Create one or multiple CAIS change intake entries
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const defaultBa = await prisma.user.findFirst({ where: { role: 'BA' } });

    // Handle batch creation of multiple changes
    if (Array.isArray(body.changes)) {
      const createdList = [];
      for (const item of body.changes) {
        const authorId = item.userId || body.userId || defaultBa?.id;
        if (!item.title || !item.crReference) continue;

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
            createdById: authorId!,
          },
        });
        createdList.push(newChange);
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

    const authorId = userId || defaultBa?.id;

    if (!authorId) {
      return NextResponse.json({ error: 'Valid user is required to submit a change' }, { status: 400 });
    }

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
  } catch (error: any) {
    console.error('Error creating change:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
