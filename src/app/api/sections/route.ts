import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { MASTER_SECTIONS } from '@/lib/sectionsData';

const prisma = new PrismaClient();

// GET /api/sections - List all living document sections 1.1-2.6 & Appendix with relational SubSections
export async function GET() {
  try {
    const sections = await prisma.documentSection.findMany({
      include: {
        lastUpdatedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        subSections: {
          orderBy: { displayOrder: 'asc' },
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 5,
              include: {
                editedBy: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    if (sections && sections.length > 0) {
      return NextResponse.json({ sections });
    }
  } catch (error: any) {
    console.error('Error fetching sections from DB, using fallback:', error?.message);
  }

  return NextResponse.json({ sections: MASTER_SECTIONS });
}
