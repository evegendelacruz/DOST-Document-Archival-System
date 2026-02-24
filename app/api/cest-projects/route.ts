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

    // Get logged-in user info to set as assignee
    let staffAssigned: string | null = data.staffAssigned || null;
    let assigneeProfileUrl: string | null = data.assigneeProfileUrl || null;

    if (userId && !staffAssigned) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, profileImageUrl: true },
      });
      if (user) {
        staffAssigned = user.fullName;
        assigneeProfileUrl = user.profileImageUrl;
      }
    }

    const project = await prisma.cestProject.create({
      data: {
        ...data,
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
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
