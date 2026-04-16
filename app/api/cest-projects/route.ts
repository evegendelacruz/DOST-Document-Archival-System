import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-log';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const funding = searchParams.get('funding');

    const where: Record<string, unknown> = {};
    if (funding) where.programFunding = funding;
    if (search) {
      where.OR = [
        { projectTitle: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { beneficiaries: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.cestProject.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('GET /api/cest-projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const userId = getUserIdFromRequest(req);

    // Get logged-in user info to set as assignee (always use creator)
    let staffAssigned: string | null = null;
    let assigneeProfileUrl: string | null = null;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, profileImageUrl: true },
      });
      if (user) {
        staffAssigned = user.fullName;
        assigneeProfileUrl = user.profileImageUrl;
      }
    }

    // Handle project code - validate uniqueness if provided, otherwise leave null
    const projectCode = data.code?.trim() || null;

    if (projectCode) {
      // Check if the provided code already exists
      const existingProject = await prisma.cestProject.findUnique({
        where: { code: projectCode },
      });
      if (existingProject) {
        return NextResponse.json({ error: 'Project code already exists' }, { status: 400 });
      }
    }

    // Remove fields that we handle separately to prevent conflicts
    const {
      staffAssigned: _ignored,
      assigneeProfileUrl: _ignored2,
      code: _ignored3,
      ...restData
    } = data;

    const project = await prisma.cestProject.create({
      data: {
        ...restData,
        code: projectCode,
        staffAssigned,
        assigneeProfileUrl,
      },
    });

    if (userId) {
      await logActivity({
        userId,
        action: 'CREATE',
        resourceType: 'CEST_PROJECT',
        resourceId: project.id,
        resourceTitle: project.projectTitle,
        details: { code: project.code, location: project.location },
      });
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('POST /api/cest-projects error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
