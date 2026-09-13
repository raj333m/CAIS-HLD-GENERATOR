import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const items = await db.caisDataItem.findMany({
      orderBy: [{ category: 'asc' }, { itemCode: 'asc' }],
    });
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'BA')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { itemCode, itemName, category, description, currentDefinition } = body;

    if (!itemCode || !itemName || !category) {
      return NextResponse.json({ error: 'Item code, name, and category are required' }, { status: 400 });
    }

    const newItem = await db.caisDataItem.create({
      data: {
        itemCode: itemCode.toUpperCase(),
        itemName,
        category,
        description: description || '',
        currentDefinition: currentDefinition || '',
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, itemName, category, description, currentDefinition, isActive } = body;

    const updated = await db.caisDataItem.update({
      where: { id },
      data: {
        itemName,
        category,
        description,
        currentDefinition,
        isActive,
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
