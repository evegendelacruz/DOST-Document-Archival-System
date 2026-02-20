import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-log';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const userId = getUserIdFromRequest(req);

  // Get original event for logging
  const originalEvent = await prisma.calendarEvent.findUnique({ where: { id } });

  const event = await prisma.calendarEvent.update({
    where: { id },
    data,
  });

  // Log activity
  if (userId && originalEvent) {
    const changedFields = Object.keys(data).filter(
      (key) => data[key] !== (originalEvent as Record<string, unknown>)[key]
    );
    await logActivity({
      userId,
      action: 'UPDATE',
      resourceType: 'CALENDAR_EVENT',
      resourceId: event.id,
      resourceTitle: event.title,
      details: { changedFields, date: event.date },
    });
  }

  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = getUserIdFromRequest(req);

  // Get event before deletion for logging
  const event = await prisma.calendarEvent.findUnique({ where: { id } });

  await prisma.calendarEvent.delete({ where: { id } });

  // Log activity
  if (userId && event) {
    await logActivity({
      userId,
      action: 'DELETE',
      resourceType: 'CALENDAR_EVENT',
      resourceId: id,
      resourceTitle: event.title,
      details: { date: event.date, location: event.location },
    });
  }

  return NextResponse.json({ success: true });
}
