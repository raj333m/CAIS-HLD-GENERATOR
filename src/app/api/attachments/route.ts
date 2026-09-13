import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get('sectionId');

    const where = sectionId ? { sectionId } : {};

    const attachments = await prisma.documentAttachment.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ attachments });
  } catch (error: any) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileType, fileSize, fileDataUrl, sectionId, uploadedBy } = body;

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType are required' }, { status: 400 });
    }

    const attachment = await prisma.documentAttachment.create({
      data: {
        fileName,
        fileType: String(fileType).toLowerCase(),
        fileSize: Number(fileSize) || 0,
        fileDataUrl: fileDataUrl || null,
        sectionId: sectionId || 'GENERAL',
        uploadedBy: uploadedBy || 'System User',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Receipt of upload confirmed: ${attachment.fileName}`,
      attachment,
    });
  } catch (error: any) {
    console.error('Error creating attachment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Attachment ID is required' }, { status: 400 });
    }

    await prisma.documentAttachment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
