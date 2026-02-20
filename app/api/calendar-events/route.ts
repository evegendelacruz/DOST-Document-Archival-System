import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-log';

export async function GET() {
  const events = await prisma.calendarEvent.findMany({
    orderBy: { date: 'asc' },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const userId = getUserIdFromRequest(req);

  const event = await prisma.calendarEvent.create({ data });

  // Log activity
  if (userId) {
    await logActivity({
      userId,
      action: 'CREATE',
      resourceType: 'CALENDAR_EVENT',
      resourceId: event.id,
      resourceTitle: event.title,
      details: { date: event.date, location: event.location, priority: event.priority },
    });
  }

  return NextResponse.json(event, { status: 201 });
}
