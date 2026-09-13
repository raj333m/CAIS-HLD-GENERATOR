import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { generateStructuredHldContent } from '@/lib/hldGenerator';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const bureau = searchParams.get('bureau') || '';
    const changeType = searchParams.get('changeType') || '';
    const month = searchParams.get('month') || '';

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (month) {
      where.targetMonth = { contains: month };
    }

    if (changeType) {
      where.changeTypes = { contains: changeType };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { changeReference: { contains: search } },
        { description: { contains: search } },
        { regulatoryDriver: { contains: search } },
      ];
    }

    let hlds = await db.hldDocument.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
        dataItemImpacts: { include: { dataItem: true } },
        bureauNotes: { include: { bureau: true } },
        risks: true,
        stakeholders: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Post-filter by bureau if requested
    if (bureau) {
      hlds = hlds.filter((hld: any) =>
        hld.bureauNotes.some((bn: any) => bn.bureau.name.toLowerCase() === bureau.toLowerCase() && bn.applies)
      );
    }

    return NextResponse.json({ success: true, hlds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      changeReference,
      description,
      regulatoryDriver,
      requestedBy,
      targetMonth,
      changeTypes,
      dataItemImpacts,
      bureauNotes,
      sourceToBureauFlow,
      dataQualityChecks,
      errorHandling,
      auditTrail,
      dataProtection,
      consumerImpact,
      uatApproach,
      implementationDate,
      rollbackApproach,
      assumptions,
      constraints,
      dependencies,
      risks,
      stakeholders,
      currentStateNotes,
    } = body;

    if (!title || !changeReference || !targetMonth) {
      return NextResponse.json({ error: 'Title, Change Reference, and Target Month are required' }, { status: 400 });
    }

    // Check duplicate reference
    const existingRef = await db.hldDocument.findUnique({ where: { changeReference } });
    if (existingRef) {
      return NextResponse.json({ error: `Change reference ${changeReference} already exists` }, { status: 400 });
    }

    // Auto generate content JSON
    const contentJson = generateStructuredHldContent(
      {
        title,
        changeReference,
        description: description || '',
        regulatoryDriver: regulatoryDriver || '',
        requestedBy: requestedBy || user.name,
        targetMonth,
        changeTypes: changeTypes || [],
        dataItemImpacts: dataItemImpacts || [],
        bureauNotes: bureauNotes || [],
        sourceToBureauFlow: sourceToBureauFlow || '',
        dataQualityChecks: dataQualityChecks || '',
        errorHandling: errorHandling || '',
        auditTrail: auditTrail || '',
        dataProtection: dataProtection || '',
        consumerImpact: consumerImpact || '',
        uatApproach: uatApproach || '',
        implementationDate: implementationDate || '',
        rollbackApproach: rollbackApproach || '',
        assumptions: assumptions || '',
        constraints: constraints || '',
        dependencies: dependencies || '',
        risks: risks || [],
        stakeholders: stakeholders || [],
        currentStateNotes,
      },
      user.name
    );

    const newHld = await db.hldDocument.create({
      data: {
        title,
        changeReference,
        status: 'DRAFT',
        targetMonth,
        regulatoryDriver: regulatoryDriver || '',
        description: description || '',
        requestedBy: requestedBy || user.name,
        changeTypes: (changeTypes || []).join(','),
        sourceToBureauFlow,
        dataQualityChecks,
        errorHandling,
        auditTrail,
        dataProtection,
        consumerImpact,
        uatApproach,
        rollbackApproach,
        implementationDate,
        assumptions,
        constraints,
        dependencies,
        createdById: user.userId,
        version: 1,
        content: contentJson,
        dataItemImpacts: {
          create: (dataItemImpacts || []).map((imp: any) => ({
            dataItemId: imp.dataItemId || null,
            customItemName: imp.customItemName || null,
            currentDefinition: imp.currentDefinition || '',
            newDefinition: imp.newDefinition || '',
            sourceSystem: imp.sourceSystem || '',
            mappingNotes: imp.mappingNotes || '',
            appliesToExperian: imp.appliesToExperian ?? true,
            appliesToEquifax: imp.appliesToEquifax ?? true,
            appliesToTransunion: imp.appliesToTransunion ?? true,
          })),
        },
        bureauNotes: {
          create: (bureauNotes || []).map((bn: any) => ({
            bureauId: bn.bureauId,
            applies: bn.applies ?? true,
            targetDate: bn.targetDate || '',
            notes: bn.notes || '',
          })),
        },
        risks: {
          create: (risks || []).map((r: any) => ({
            risk: r.risk,
            impact: r.impact || 'Medium',
            mitigation: r.mitigation,
          })),
        },
        stakeholders: {
          create: (stakeholders || []).map((s: any) => ({
            name: s.name,
            team: s.team,
            role: s.role,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        dataItemImpacts: { include: { dataItem: true } },
        bureauNotes: { include: { bureau: true } },
        risks: true,
        stakeholders: true,
      },
    });

    // Create initial version snapshot
    await db.hldVersion.create({
      data: {
        hldId: newHld.id,
        versionNumber: 1,
        snapshotContent: contentJson,
        editedById: user.userId,
      },
    });

    return NextResponse.json({ success: true, hld: newHld });
  } catch (error: any) {
    console.error('Create HLD error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
