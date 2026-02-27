import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-log';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  const userId = getUserIdFromRequest(req);

  const doc = await prisma.cestProjectDocument.findUnique({
    where: { id: docId },
    select: { fileName: true, phase: true },
  });

  await prisma.cestProjectDocument.delete({ where: { id: docId } });

  if (userId && doc) {
    const project = await prisma.cestProject.findUnique({ where: { id }, select: { projectTitle: true, code: true } });
    await logActivity({
      userId,
      action: 'DELETE',
      resourceType: 'CEST_DOCUMENT',
      resourceId: docId,
      resourceTitle: doc.fileName,
      details: { projectTitle: project?.projectTitle, projectCode: project?.code, phase: doc.phase },
    });
  }

  return NextResponse.json({ success: true });
}
