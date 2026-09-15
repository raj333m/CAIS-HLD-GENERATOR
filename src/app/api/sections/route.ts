import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { MASTER_SECTIONS, BLANK_SECTIONS } from '@/lib/sectionsData';

const prisma = new PrismaClient();

// GET /api/sections - List living document sections
export async function GET(request: NextRequest) {
  try {
    const sections = await prisma.documentSection.findMany({
      include: { subSections: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    });
    if (sections && sections.length > 0) {
      return NextResponse.json({ sections });
    }
  } catch (error: any) {
    console.error('Error fetching sections query:', error?.message);
  }

  return NextResponse.json({ sections: MASTER_SECTIONS });
}
