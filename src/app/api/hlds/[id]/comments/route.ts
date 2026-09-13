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
    const { text, sectionId } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Comment text cannot be empty' }, { status: 400 });
    }

    const comment = await db.hldComment.create({
      data: {
        hldId: id,
        userId: user.userId,
        sectionId: sectionId || null,
        text: text.trim(),
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
