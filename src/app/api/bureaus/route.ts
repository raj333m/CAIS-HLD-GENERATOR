import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const bureaus = await db.bureau.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, bureaus });
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
    const { id, submissionChannel, fileFormat, cutoffDate, fileSpecVersion, notes } = body;

    const updated = await db.bureau.update({
      where: { id },
      data: {
        submissionChannel,
        fileFormat,
        cutoffDate,
        fileSpecVersion,
        notes,
      },
    });

    return NextResponse.json({ success: true, bureau: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
