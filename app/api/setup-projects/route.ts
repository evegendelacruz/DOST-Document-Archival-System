import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-log';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { firm: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const projects = await prisma.setupProject.findMany({
    where,
    orderBy: { code: 'asc' },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const userId = getUserIdFromRequest(req);

  // Auto-generate project code based on highest existing code
  const last = await prisma.setupProject.findFirst({ orderBy: { code: 'desc' } });
  const nextNum = last ? parseInt(last.code, 10) + 1 : 1;
  const code = String(nextNum).padStart(3, '0');

  const project = await prisma.setupProject.create({
    data: { ...data, code },
  });

  // Log activity
  if (userId) {
    await logActivity({
      userId,
      action: 'CREATE',
      resourceType: 'SETUP_PROJECT',
      resourceId: project.id,
      resourceTitle: project.title,
      details: { code: project.code, firm: project.firm },
    });
  }

  return NextResponse.json(project, { status: 201 });
}
