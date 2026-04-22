import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/activity-log';

interface FundReleaseRow {
  releaseDate: string;
}

interface PdeRow {
  months: string;
  date: string;
}

interface DropdownData {
  fundReleaseDateRows?: FundReleaseRow[];
  pdeRows?: PdeRow[];
  [key: string]: unknown;
}

// Calculate deadline: Fund Release Date + 12 months (base) + PDE extension months
function calculateDeadline(fundReleaseDate: string, pdeRows: PdeRow[]): Date {
  const baseMonths = 12;
  const pdeMonths = pdeRows.reduce((sum, row) => {
    const months = parseInt(row.months) || 0;
    return sum + months;
  }, 0);

  const deadline = new Date(fundReleaseDate);
  deadline.setMonth(deadline.getMonth() + baseMonths + pdeMonths);
  return deadline;
}

// Calculate days remaining until deadline
function calculateDaysRemaining(deadline: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get urgency status based on days remaining
function getUrgencyStatus(daysRemaining: number): { status: string; isUrgent: boolean } {
  if (daysRemaining <= 0) {
    return { status: 'DEADLINE REACHED', isUrgent: true };
  } else if (daysRemaining <= 30) {
    return { status: 'URGENT', isUrgent: true };
  } else if (daysRemaining <= 90) {
    return { status: 'Due Soon', isUrgent: true };
  } else if (daysRemaining <= 180) {
    return { status: 'Approaching', isUrgent: false };
  } else {
    return { status: 'On Track', isUrgent: false };
  }
}

// Format date for display
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Get today's date string for deduplication key
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get current user to check role and name
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = currentUser.role === 'ADMIN';

    // Get all setup projects
    // If admin, get all projects with fund release dates
    // If not admin, only get projects where user is the assignee
    const projects = await prisma.setupProject.findMany({
      where: isAdmin
        ? {} // Admin sees all projects
        : { assignee: currentUser.fullName }, // Non-admin only sees their own projects
      select: {
        id: true,
        title: true,
        assignee: true,
        dropdownData: true,
        companyLogoUrl: true, // Include project logo
      },
    });

    const todayKey = getTodayKey();
    const notifications: Array<{
      projectId: string;
      projectTitle: string;
      daysRemaining: number;
      deadline: string;
      status: string;
      isUrgent: boolean;
      fundReleaseDate: string;
      totalExtension: number;
    }> = [];

    for (const project of projects) {
      const dropdownData = project.dropdownData as DropdownData | null;
      if (!dropdownData) continue;

      const fundReleaseDateRows = dropdownData.fundReleaseDateRows || [];
      const pdeRows = dropdownData.pdeRows || [];

      // Check each fund release date
      for (const fundRow of fundReleaseDateRows) {
        if (!fundRow.releaseDate) continue;

        const deadline = calculateDeadline(fundRow.releaseDate, pdeRows);
        const daysRemaining = calculateDaysRemaining(deadline);
        const { status, isUrgent } = getUrgencyStatus(daysRemaining);

        // Only include if within 12-month (365 days) window
        if (daysRemaining <= 365) {
          const pdeMonths = pdeRows.reduce((sum, row) => sum + (parseInt(row.months) || 0), 0);

          notifications.push({
            projectId: project.id,
            projectTitle: project.title,
            daysRemaining,
            deadline: formatDate(deadline),
            status,
            isUrgent,
            fundReleaseDate: fundRow.releaseDate,
            totalExtension: pdeMonths,
          });

          // Check if we already sent a notification today for this project
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId,
              type: 'deadline',
              eventId: project.id,
              createdAt: {
                gte: new Date(todayKey),
                lt: new Date(new Date(todayKey).getTime() + 24 * 60 * 60 * 1000),
              },
            },
          });

          // Create notification if not already sent today
          if (!existingNotification) {
            let title = '';
            let message = '';

            if (daysRemaining <= 0) {
              title = 'Reminder: Deadline Reached!';
              message = `Project "${project.title}" has reached its deadline. Immediate action required.`;
            } else {
              title = `Reminder: ${daysRemaining} Day${daysRemaining > 1 ? 's' : ''} Left Before Deadline`;
              message = `Project "${project.title}" deadline is on ${formatDate(deadline)}.`;
            }

            await prisma.notification.create({
              data: {
                userId,
                type: 'deadline',
                title,
                message,
                eventId: project.id,
                bookedByProfileUrl: project.companyLogoUrl || null, // Store project logo URL
                read: false,
              },
            });
          }

          // Update ALL existing deadline notifications for this project with the logo if missing
          if (project.companyLogoUrl) {
            await prisma.notification.updateMany({
              where: {
                userId,
                type: 'deadline',
                eventId: project.id,
                bookedByProfileUrl: null,
              },
              data: { bookedByProfileUrl: project.companyLogoUrl },
            });
          }
        }
      }
    }

    // Sort by urgency (fewer days = more urgent)
    notifications.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error('Error checking deadlines:', error);
    return NextResponse.json({ error: 'Failed to check deadlines' }, { status: 500 });
  }
}

// POST endpoint to manually trigger deadline check (useful for testing)
export async function POST(req: NextRequest) {
  return GET(req);
}
