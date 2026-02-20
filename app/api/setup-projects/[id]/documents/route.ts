import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const documents = await prisma.projectDocument.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      projectId: true,
      phase: true,
      templateItemId: true,
      fileName: true,
      fileUrl: true,
      mimeType: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await req.formData();
  const userId = formData.get('userId') as string | null;

  console.log('[Documents API] POST - userId:', userId);

  const file = formData.get('file') as File | null;
  const phase = formData.get('phase') as string;
  const templateItemId = formData.get('templateItemId') as string;

  if (!file || !phase || !templateItemId) {
    return NextResponse.json({ error: 'file, phase, and templateItemId are required' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Get the project for logging
  const project = await prisma.setupProject.findUnique({ where: { id } });

  const document = await prisma.projectDocument.create({
    data: {
      projectId: id,
      phase: phase as 'INITIATION' | 'IMPLEMENTATION',
      templateItemId,
      fileName: file.name,
      fileUrl: `/api/setup-projects/${id}/documents/download`,
      mimeType: file.type || 'application/octet-stream',
      fileData: buffer,
    },
    select: {
      id: true,
      projectId: true,
      phase: true,
      templateItemId: true,
      fileName: true,
      fileUrl: true,
      mimeType: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Log activity directly
  console.log('[Documents API] Attempting to log activity, userId:', userId);
  if (userId) {
    try {
      const logEntry = await prisma.userLog.create({
        data: {
          userId,
          action: 'UPLOAD',
          resourceType: 'DOCUMENT',
          resourceId: document.id,
          resourceTitle: file.name,
          details: JSON.stringify({
            projectId: id,
            projectTitle: project?.title,
            projectCode: project?.code,
            phase,
          }),
        },
      });
      console.log('[Documents API] Activity logged successfully! Log ID:', logEntry.id);
    } catch (error) {
      console.error('[Documents API] FAILED to log activity:', error);
    }
  } else {
    console.warn('[Documents API] No userId provided in formData, skipping activity log');
  }

  return NextResponse.json(document, { status: 201 });
}
