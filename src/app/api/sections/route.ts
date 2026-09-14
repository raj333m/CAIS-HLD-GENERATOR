import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { MASTER_SECTIONS, BLANK_SECTIONS } from '@/lib/sectionsData';

const prisma = new PrismaClient();

// GET /api/sections - List living document sections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseline = searchParams.get('baseline');
    if (baseline === 'true') {
      return NextResponse.json({ sections: MASTER_SECTIONS });
    }
  } catch (error: any) {
    console.error('Error fetching sections query:', error?.message);
  }

  return NextResponse.json({ sections: BLANK_SECTIONS });
}
