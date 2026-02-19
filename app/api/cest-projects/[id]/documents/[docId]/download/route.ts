import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { docId } = await params;

  const doc = await prisma.cestProjectDocument.findUnique({
    where: { id: docId },
    select: { fileData: true, fileName: true, mimeType: true },
  });

  if (!doc || !doc.fileData) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  return new NextResponse(doc.fileData, {
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.fileName)}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
