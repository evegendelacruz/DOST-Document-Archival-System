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

    // Get logged-in user info to set as staff assigned
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

    // Get existing project titles and codes to check for duplicates
    const existingProjects = await prisma.cestProject.findMany({
      select: { projectTitle: true, code: true },
    });
    const existingTitles = new Set(existingProjects.map(p => p.projectTitle.toLowerCase()));
    const existingCodes = new Set(existingProjects.map(p => p.code));

    // Find the actual highest numeric suffix (string sort is unreliable)
    const allNumericSuffixes = existingProjects.map(p => parseInt(p.code.replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
    let nextCodeNum = allNumericSuffixes.length > 0 ? Math.max(...allNumericSuffixes) + 1 : 1;

    // Filter out duplicates and prepare projects for insertion
    const projectsToCreate = projects
      .filter((p: Record<string, unknown>) =>
        p.projectTitle && !existingTitles.has(String(p.projectTitle).toLowerCase())
      )
      .map((p: Record<string, unknown>) => {
        // Use provided code if it doesn't collide, otherwise auto-generate
        let code: string;
        const providedCode = p.code ? String(p.code).trim() : '';
        if (providedCode && !existingCodes.has(providedCode)) {
          code = providedCode;
          existingCodes.add(code);
        } else {
          let candidate = `CEST-${String(nextCodeNum).padStart(3, '0')}`;
          while (existingCodes.has(candidate)) { nextCodeNum++; candidate = `CEST-${String(nextCodeNum).padStart(3, '0')}`; }
          code = candidate;
          nextCodeNum++;
          existingCodes.add(code);
        }
        return {
        projectTitle: String(p.projectTitle),
        code,
        location: p.location ? String(p.location) : null,
        coordinates: p.coordinates ? String(p.coordinates) : null,
        beneficiaries: p.beneficiaries ? String(p.beneficiaries) : null,
        typeOfBeneficiary: p.typeOfBeneficiary ? String(p.typeOfBeneficiary) : null,
        programFunding: p.programFunding ? String(p.programFunding) : null,
        stakeholderCounterparts: Array.isArray(p.stakeholderCounterparts)
          ? p.stakeholderCounterparts.map(String)
          : p.stakeholderCounterparts
            ? String(p.stakeholderCounterparts).split(',').map(s => s.trim()).filter(Boolean)
            : null,
        status: p.status ? String(p.status) : null,
        approvedAmount: typeof p.approvedAmount === 'number' ? p.approvedAmount : null,
        releasedAmount: typeof p.releasedAmount === 'number' ? p.releasedAmount : null,
        counterpartAmount: typeof p.counterpartAmount === 'number' ? p.counterpartAmount : null,
        projectDuration: p.projectDuration ? String(p.projectDuration) : null,
        staffAssigned: p.staffAssigned ? String(p.staffAssigned) : staffAssigned,
        assigneeProfileUrl: assigneeProfileUrl,
        year: p.year ? String(p.year) : null,
        dateOfApproval: p.dateOfApproval ? String(p.dateOfApproval) : null,
        emails: Array.isArray(p.emails) ? p.emails.map(String) : null,
        contactNumbers: Array.isArray(p.contactNumbers) ? p.contactNumbers.map(String) : null,
        categories: Array.isArray(p.categories) ? p.categories.map(String) : null,
        };
      });

    if (projectsToCreate.length === 0) {
      return NextResponse.json({
        error: 'All projects have duplicate titles or missing required fields',
        imported: 0
      }, { status: 400 });
    }

    // Create projects in bulk
    const result = await prisma.cestProject.createMany({
      data: projectsToCreate,
    });

    // Log activity
    if (userId) {
      await logActivity({
        userId,
        action: 'IMPORT',
        resourceType: 'CEST_PROJECT',
        resourceId: 'bulk',
        resourceTitle: `Imported ${result.count} CEST projects`,
        details: { count: result.count },
      });
    }

    return NextResponse.json({
      success: true,
      imported: result.count,
      message: `Successfully imported ${result.count} projects`
    });

  } catch (error) {
    console.error('CEST Import error:', error);
    return NextResponse.json({
      error: 'Failed to import projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
