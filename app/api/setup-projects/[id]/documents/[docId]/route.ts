import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  const data = await req.json();
  const userId = req.headers.get('x-user-id');

  // Get original document for logging
  const originalDocument = await prisma.projectDocument.findUnique({
    where: { id: docId },
    include: { project: true },
  });

  const document = await prisma.projectDocument.update({
    where: { id: docId },
    data,
  });

  // Log activity directly
  if (userId && originalDocument) {
    try {
      await prisma.userLog.create({
        data: {
          userId,
          action: 'UPDATE',
          resourceType: 'DOCUMENT',
          resourceId: docId,
          resourceTitle: document.fileName,
          details: JSON.stringify({
            projectId: id,
            projectTitle: originalDocument.project?.title,
            projectCode: originalDocument.project?.code,
          }),
        },
      });
    } catch { /* activity log failure is non-critical */ }
  }

  return NextResponse.json(document);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  const userId = req.headers.get('x-user-id');

  // Get document before deletion for logging
  const document = await prisma.projectDocument.findUnique({
    where: { id: docId },
    include: { project: true },
  });

  await prisma.projectDocument.delete({ where: { id: docId } });

  // Log activity directly
  if (userId && document) {
    try {
      await prisma.userLog.create({
        data: {
          userId,
          action: 'DELETE',
          resourceType: 'DOCUMENT',
          resourceId: docId,
          resourceTitle: document.fileName,
          details: JSON.stringify({
            projectId: id,
            projectTitle: document.project?.title,
            projectCode: document.project?.code,
            phase: document.phase,
          }),
        },
      });
    } catch { /* activity log failure is non-critical */ }
  }

  return NextResponse.json({ success: true });
}
