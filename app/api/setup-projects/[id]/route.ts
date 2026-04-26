import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.setupProject.findUnique({
    where: { id },
    include: { documents: true },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const userId = req.headers.get('x-user-id');

  // Get the original project for logging
  const originalProject = await prisma.setupProject.findUnique({ where: { id } });

  const project = await prisma.setupProject.update({
    where: { id },
    data,
  });

  // Log activity directly
  if (userId && originalProject) {
    try {
      const changedFields = Object.keys(data).filter(
        (key) => data[key] !== (originalProject as Record<string, unknown>)[key]
      );
      await prisma.userLog.create({
        data: {
          userId,
          action: 'UPDATE',
          resourceType: 'SETUP_PROJECT',
          resourceId: project.id,
          resourceTitle: project.title,
          details: JSON.stringify({ changedFields, code: project.code }),
        },
      });
    } catch { /* activity log failure is non-critical */ }
  }

  return NextResponse.json(project);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = req.headers.get('x-user-id');

  // Get the project before deletion for logging
  const project = await prisma.setupProject.findUnique({ where: { id } });

  await prisma.setupProject.delete({ where: { id } });

  // Log activity directly
  if (userId && project) {
    try {
      await prisma.userLog.create({
        data: {
          userId,
          action: 'DELETE',
          resourceType: 'SETUP_PROJECT',
          resourceId: id,
          resourceTitle: project.title,
          details: JSON.stringify({ code: project.code, firm: project.firm }),
        },
      });
    } catch { /* activity log failure is non-critical */ }
  }

  return NextResponse.json({ success: true });
}
