import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const documents = await prisma.cestProjectDocument.findMany({
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

  const file = formData.get('file') as File | null;
  const phase = formData.get('phase') as string;
  const templateItemId = formData.get('templateItemId') as string;

  if (!file || !phase || !templateItemId) {
    return NextResponse.json({ error: 'file, phase, and templateItemId are required' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const document = await prisma.cestProjectDocument.create({
    data: {
      projectId: id,
      phase: phase as 'INITIATION' | 'IMPLEMENTATION' | 'MONITORING',
      templateItemId,
      fileName: file.name,
      fileUrl: `/api/cest-projects/${id}/documents/download`,
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

  return NextResponse.json(document, { status: 201 });
}
