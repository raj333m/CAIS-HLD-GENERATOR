import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const original = await db.hldDocument.findUnique({
      where: { id },
      include: {
        dataItemImpacts: true,
        bureauNotes: true,
        risks: true,
        stakeholders: true,
      },
    });

    if (!original) {
      return NextResponse.json({ error: 'Original HLD not found' }, { status: 404 });
    }

    // Generate unique clone reference
    const timestamp = Date.now().toString().slice(-4);
    const newRef = `${original.changeReference}-CLONE-${timestamp}`;
    const newTitle = `[Copy] ${original.title}`;

    // Update document control inside JSON content
    let newContent = original.content;
    try {
      const parsed = JSON.parse(original.content);
      if (parsed.docControl) {
        parsed.docControl.title = newTitle;
        parsed.docControl.changeRef = newRef;
        parsed.docControl.status = 'DRAFT';
        parsed.docControl.author = user.name;
        parsed.docControl.reviewer = 'Unassigned';
        parsed.docControl.version = '1.0';
        parsed.docControl.date = new Date().toISOString().split('T')[0];
      }
      newContent = JSON.stringify(parsed, null, 2);
    } catch (e) {
      // ignore
    }

    const clonedHld = await db.hldDocument.create({
      data: {
        title: newTitle,
        changeReference: newRef,
        status: 'DRAFT',
        targetMonth: original.targetMonth,
        regulatoryDriver: original.regulatoryDriver,
        description: original.description,
        requestedBy: user.name,
        changeTypes: original.changeTypes,
        sourceToBureauFlow: original.sourceToBureauFlow,
        dataQualityChecks: original.dataQualityChecks,
        errorHandling: original.errorHandling,
        auditTrail: original.auditTrail,
        dataProtection: original.dataProtection,
        consumerImpact: original.consumerImpact,
        uatApproach: original.uatApproach,
        rollbackApproach: original.rollbackApproach,
        implementationDate: original.implementationDate,
        assumptions: original.assumptions,
        constraints: original.constraints,
        dependencies: original.dependencies,
        createdById: user.userId,
        version: 1,
        content: newContent,
        dataItemImpacts: {
          create: original.dataItemImpacts.map((imp: any) => ({
            dataItemId: imp.dataItemId,
            customItemName: imp.customItemName,
            currentDefinition: imp.currentDefinition,
            newDefinition: imp.newDefinition,
            sourceSystem: imp.sourceSystem,
            mappingNotes: imp.mappingNotes,
            appliesToExperian: imp.appliesToExperian,
            appliesToEquifax: imp.appliesToEquifax,
            appliesToTransunion: imp.appliesToTransunion,
          })),
        },
        bureauNotes: {
          create: original.bureauNotes.map((bn: any) => ({
            bureauId: bn.bureauId,
            applies: bn.applies,
            targetDate: bn.targetDate,
            notes: bn.notes,
          })),
        },
        risks: {
          create: original.risks.map((r: any) => ({
            risk: r.risk,
            impact: r.impact,
            mitigation: r.mitigation,
          })),
        },
        stakeholders: {
          create: original.stakeholders.map((s: any) => ({
            name: s.name,
            team: s.team,
            role: s.role,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Version 1 snapshot
    await db.hldVersion.create({
      data: {
        hldId: clonedHld.id,
        versionNumber: 1,
        snapshotContent: newContent,
        editedById: user.userId,
      },
    });

    return NextResponse.json({ success: true, hld: clonedHld });
  } catch (error: any) {
    console.error('Clone error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
