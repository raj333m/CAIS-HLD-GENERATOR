import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PREPOPULATED_CHANGES } from '../route';
import { saveCloudChangeState, deletedIds, deleteCreatedChange, getCreatedChanges, saveCreatedChange, getCloudChangeState, getMergedChanges } from '@/lib/cloudStore';

const prisma = new PrismaClient();

// GET /api/changes/[id] - Fetch a single CAIS change entry
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const allChanges = await getMergedChanges(prisma, PREPOPULATED_CHANGES, { includeDrafts: true });
    const cleanRef = id.replace(/^change-/, '').toUpperCase();

    const change = allChanges.find(
      (c: any) =>
        c.id === id ||
        c.crReference === id ||
        c.crReference?.toLowerCase() === id.toLowerCase() ||
        c.crReference?.toUpperCase() === cleanRef
    );

    if (!change) {
      return NextResponse.json({ error: 'Change entry not found' }, { status: 404 });
    }

    return NextResponse.json({ change });
  } catch (error: any) {
    console.error('Error fetching change:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/changes/[id] - Modify/Update a single CAIS change entry
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingChange = await prisma.caisChange.findUnique({ where: { id } });

    const {
      title,
      crReference,
      status,
      changeType,
      businessDriver,
      description,
      beforeText,
      afterText,
      sectionsUpdated,
      impactedBureaus,
      impactedDataItems,
      targetMonth,
      reviewedById,
      reviewComments,
    } = body;

    const formattedBureaus = Array.isArray(impactedBureaus) ? impactedBureaus.join(', ') : impactedBureaus;
    const todayStr = new Date().toISOString().split('T')[0];

    if (!existingChange) {
      // Fallback update/create if entry was prepopulated or created dynamically
      try {
        const defaultBa = await prisma.user.findFirst({ where: { role: 'BA' } });
        const created = await prisma.caisChange.create({
          data: {
            id,
            title: title || 'Draft CAIS Change',
            crReference: crReference || id,
            status: status || 'DRAFT',
            changeType: changeType || 'Existing data item amended',
            businessDriver: businessDriver || 'CAIS Regulatory Requirement',
            description: description || '',
            beforeText: beforeText || '',
            afterText: afterText || '',
            sectionsUpdated: sectionsUpdated || '1.3',
            impactedBureaus: formattedBureaus || 'HSBC Cards (51), First Direct (211), M&S Loans (947), HSBC Retail (85), M&S Current Accounts (662)',
            impactedDataItems: impactedDataItems || '',
            targetMonth: targetMonth || 'November 2026',
            createdById: defaultBa?.id || 'ba-demo-user-id',
          },
        });
        return NextResponse.json({ change: created });
      } catch (createErr) {
        return NextResponse.json({
          change: {
            id,
            title: title || 'Draft CAIS Change',
            crReference: crReference || id,
            status: status || 'DRAFT',
            changeType: changeType || 'Existing data item amended',
            businessDriver: businessDriver || 'CAIS Regulatory Requirement',
            description: description || '',
            sectionsUpdated: sectionsUpdated || '1.3',
            impactedBureaus: formattedBureaus || 'HSBC Cards (51), First Direct (211), M&S Loans (947), HSBC Retail (85), M&S Current Accounts (662)',
            targetMonth: targetMonth || 'November 2026',
          },
        });
      }
    }

    const isResubmission = status === 'IN_REVIEW' && (existingChange.status === 'SENT_BACK' || existingChange.status === 'DRAFT' || existingChange.status === 'REVISION_REQUESTED');
    const nextVersion = isResubmission ? (existingChange.versionNumber || 1) + 1 : existingChange.versionNumber;

    const updatedChange = await prisma.caisChange.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(crReference !== undefined && { crReference }),
        ...(status !== undefined && { status }),
        ...(changeType !== undefined && { changeType }),
        ...(businessDriver !== undefined && { businessDriver }),
        ...(description !== undefined && { description }),
        ...(beforeText !== undefined && { beforeText }),
        ...(afterText !== undefined && { afterText }),
        ...(sectionsUpdated !== undefined && { sectionsUpdated }),
        ...(formattedBureaus !== undefined && { impactedBureaus: formattedBureaus }),
        ...(impactedDataItems !== undefined && { impactedDataItems }),
        ...(targetMonth !== undefined && { targetMonth }),
        ...(reviewedById !== undefined && { reviewedById }),
        ...(reviewComments !== undefined && { reviewComments }),
        ...(isResubmission && { versionNumber: nextVersion, submissionDate: todayStr }),
        ...(status === 'APPROVED' && { approvalDate: todayStr, approvedAt: new Date() }),
      },
      include: {
        createdBy: true,
        reviewedBy: true,
        risks: true,
      },
    });

    await saveCreatedChange(updatedChange);

    return NextResponse.json({ change: updatedChange });
  } catch (error: any) {
    console.error('Error updating change entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/changes/[id] - Delete a single CAIS change entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanRef = id.replace(/^change-/, '').toUpperCase();

    // 1. Find existing change in Prisma DB or pre-populated items
    const allChanges = await getMergedChanges(prisma, PREPOPULATED_CHANGES, { includeDrafts: true });
    const targetChange = allChanges.find(
      (c: any) =>
        c.id === id ||
        c.crReference === id ||
        c.crReference?.toLowerCase() === id.toLowerCase() ||
        c.crReference?.toUpperCase() === cleanRef
    );

    if (targetChange && targetChange.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot delete change entry with status '${targetChange.status}'. Only DRAFT entries can be deleted.` },
        { status: 403 }
      );
    }

    let existingChange = await prisma.caisChange.findFirst({
      where: {
        OR: [
          { id },
          { crReference: id },
          { crReference: cleanRef },
        ],
      },
    });

    const crRef = existingChange?.crReference || (id.startsWith('CAIS-') ? id : cleanRef);
    const dbId = existingChange?.id || id;

    // Track deletion in memory & CloudStore across ALL key aliases
    deletedIds.add(id);
    deletedIds.add(dbId);
    deletedIds.add(crRef);
    deletedIds.add(crRef.toLowerCase());
    deletedIds.add(crRef.toUpperCase());
    deletedIds.add(cleanRef);
    deletedIds.add(cleanRef.toLowerCase());
    deletedIds.add(`change-${cleanRef.toLowerCase()}`);

    const deleteUpdate = { deleted: true, crReference: crRef };
    await saveCloudChangeState(dbId, deleteUpdate);
    await saveCloudChangeState(id, deleteUpdate);
    await saveCloudChangeState(crRef, deleteUpdate);
    await saveCloudChangeState(crRef.toUpperCase(), deleteUpdate);
    await saveCloudChangeState(crRef.toLowerCase(), deleteUpdate);
    await deleteCreatedChange(dbId, crRef);
    await deleteCreatedChange(id, crRef);

    try {
      if (existingChange) {
        await prisma.changeRisk.deleteMany({ where: { changeId: existingChange.id } });
        await prisma.caisChange.delete({ where: { id: existingChange.id } });
      }
    } catch (e) {
      console.warn('Prisma delete attempt failed:', e);
    }

    return NextResponse.json({ success: true, message: 'Change entry deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting change entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
