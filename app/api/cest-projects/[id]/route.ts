import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-log';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.cestProject.findUnique({ where: { id } });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const userId = getUserIdFromRequest(req);

  // Get the original project for logging
  const originalProject = await prisma.cestProject.findUnique({ where: { id } });

  const project = await prisma.cestProject.update({
    where: { id },
    data,
  });

  // Log activity
  if (userId && originalProject) {
    const changedFields = Object.keys(data).filter(
      (key) => data[key] !== (originalProject as Record<string, unknown>)[key]
    );
    await logActivity({
      userId,
      action: 'UPDATE',
      resourceType: 'CEST_PROJECT',
      resourceId: project.id,
      resourceTitle: project.projectTitle,
      details: { changedFields, code: project.code },
    });
  }

  return NextResponse.json(project);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = getUserIdFromRequest(req);

  // Get the project before deletion for logging
  const project = await prisma.cestProject.findUnique({ where: { id } });

  await prisma.cestProject.delete({ where: { id } });

  // Log activity
  if (userId && project) {
    await logActivity({
      userId,
      action: 'DELETE',
      resourceType: 'CEST_PROJECT',
      resourceId: id,
      resourceTitle: project.projectTitle,
      details: { code: project.code, location: project.location },
    });
  }

  return NextResponse.json({ success: true });
}
