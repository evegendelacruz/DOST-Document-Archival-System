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
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const userId = getUserIdFromRequest(req);

  // Use provided code if given, otherwise leave it null
  const code: string | null = data.code && data.code.trim() ? data.code.trim() : null;
  // Remove code from data to avoid duplicate field
  delete data.code;

  // Get logged-in user info to set as assignee
  let assignee: string | null = null;
  let assigneeProfileUrl: string | null = null;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, profileImageUrl: true },
    });
    if (user) {
      assignee = user.fullName;
      assigneeProfileUrl = user.profileImageUrl;
    }
  }

  const project = await prisma.setupProject.create({
    data: { ...data, code, assignee, assigneeProfileUrl },
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
