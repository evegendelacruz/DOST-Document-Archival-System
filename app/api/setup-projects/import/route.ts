import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-log';

export async function POST(req: NextRequest) {
  try {
    const { projects } = await req.json();
    const userId = getUserIdFromRequest(req);

    if (!Array.isArray(projects) || projects.length === 0) {
      return NextResponse.json({ error: 'No projects to import' }, { status: 400 });
    }

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

    // Get existing project titles to check for duplicates
    const existingProjects = await prisma.setupProject.findMany({
      select: { title: true },
    });
    const existingTitles = new Set(existingProjects.map(p => p.title.toLowerCase()));

    // Filter out duplicates and prepare projects for insertion
    const projectsToCreate = projects
      .filter((p: Record<string, unknown>) =>
        p.title && !existingTitles.has(String(p.title).toLowerCase())
      )
      .map((p: Record<string, unknown>) => ({
        title: String(p.title),
        code: p.code ? String(p.code) : null,
        firm: p.firm ? String(p.firm) : null,
        typeOfFirm: p.typeOfFirm ? String(p.typeOfFirm) : null,
        address: p.address ? String(p.address) : null,
        coordinates: p.coordinates ? String(p.coordinates) : null,
        corporatorName: p.corporatorName ? String(p.corporatorName) : null,
        contactNumbers: Array.isArray(p.contactNumbers) ? p.contactNumbers.map(String) : [],
        emails: Array.isArray(p.emails) ? p.emails.map(String) : [],
        status: validateStatus(p.status),
        prioritySector: p.prioritySector ? String(p.prioritySector) : null,
        firmSize: p.firmSize ? String(p.firmSize) : null,
        fund: p.fund ? String(p.fund) : null,
        typeOfFund: p.typeOfFund ? String(p.typeOfFund) : null,
        year: p.year ? String(p.year) : null,
        assignee,
        assigneeProfileUrl,
      }));

    if (projectsToCreate.length === 0) {
      return NextResponse.json({
        error: 'All projects have duplicate titles or missing required fields',
        imported: 0
      }, { status: 400 });
    }

    // Create projects in bulk
    const result = await prisma.setupProject.createMany({
      data: projectsToCreate,
    });

    // Log activity
    if (userId) {
      await logActivity({
        userId,
        action: 'IMPORT',
        resourceType: 'SETUP_PROJECT',
        resourceId: 'bulk',
        resourceTitle: `Imported ${result.count} projects`,
        details: { count: result.count },
      });
    }

    return NextResponse.json({
      success: true,
      imported: result.count,
      message: `Successfully imported ${result.count} projects`
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({
      error: 'Failed to import projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function validateStatus(status: unknown): 'PROPOSAL' | 'APPROVED' | 'ONGOING' | 'WITHDRAWN' | 'TERMINATED' | 'GRADUATED' {
  const validStatuses = ['PROPOSAL', 'APPROVED', 'ONGOING', 'WITHDRAWN', 'TERMINATED', 'GRADUATED'];
  const statusStr = String(status || '').toUpperCase();
  return validStatuses.includes(statusStr) ? statusStr as 'PROPOSAL' | 'APPROVED' | 'ONGOING' | 'WITHDRAWN' | 'TERMINATED' | 'GRADUATED' : 'PROPOSAL';
}
