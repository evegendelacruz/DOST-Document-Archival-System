import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-log';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const userId = getUserIdFromRequest(req);

  // Get original event for logging and notification comparison
  const originalEvent = await prisma.calendarEvent.findUnique({ where: { id } });

  // Build update data, filtering out undefined values
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.date !== undefined) updateData.date = data.date;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.bookedBy !== undefined) updateData.bookedBy = data.bookedBy;
  if (data.bookedById) updateData.bookedById = data.bookedById;
  if (data.bookedService !== undefined) updateData.bookedService = data.bookedService;
  if (data.bookedPersonnel !== undefined) updateData.bookedPersonnel = data.bookedPersonnel;
  if (data.bookedPersonnelId) updateData.bookedPersonnelId = data.bookedPersonnelId;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.staffInvolved !== undefined) updateData.staffInvolved = data.staffInvolved;
  if (data.staffInvolvedIds !== undefined) updateData.staffInvolvedIds = data.staffInvolvedIds;

  const event = await prisma.calendarEvent.update({
    where: { id },
    data: updateData,
  });

  // Get user details for response (staff + bookedBy + bookedPersonnel)
  const userIdsToFetch = new Set<string>(event.staffInvolvedIds || []);
  if (event.bookedById) userIdsToFetch.add(event.bookedById);
  if (event.bookedPersonnelId) userIdsToFetch.add(event.bookedPersonnelId);

  let staffInvolvedNames = event.staffInvolved || 'N/A';
  let staffInvolvedUsers: { id: string; fullName: string; profileImageUrl: string | null }[] = [];
  let bookedByUser: { id: string; fullName: string; profileImageUrl: string | null } | null = null;
  let bookedPersonnelUser: { id: string; fullName: string; profileImageUrl: string | null } | null = null;

  if (userIdsToFetch.size > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIdsToFetch) } },
      select: { id: true, fullName: true, profileImageUrl: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    if (event.staffInvolvedIds && event.staffInvolvedIds.length > 0) {
      staffInvolvedUsers = event.staffInvolvedIds.map(id => userMap.get(id)).filter(Boolean) as typeof staffInvolvedUsers;
      staffInvolvedNames = staffInvolvedUsers.map(u => u.fullName).join(', ') || 'N/A';
    }

    if (event.bookedById) {
      bookedByUser = userMap.get(event.bookedById) || null;
    }
    if (event.bookedPersonnelId) {
      bookedPersonnelUser = userMap.get(event.bookedPersonnelId) || null;
    }
  }

  // Create notifications for newly added users (non-blocking)
  try {
    if (originalEvent) {
      // Collect newly added users (staff involved + booked personnel)
      const oldStaffIds: string[] = originalEvent.staffInvolvedIds || [];
      const newStaffIds: string[] = data.staffInvolvedIds || [];
      const addedStaffIds = newStaffIds.filter((staffId: string) => !oldStaffIds.includes(staffId));

      // Check if booked personnel changed
      const oldPersonnelId = originalEvent.bookedPersonnelId;
      const newPersonnelId = data.bookedPersonnelId;
      const personnelChanged = newPersonnelId && newPersonnelId !== oldPersonnelId;

      // Combine all users to notify
      const usersToNotify = new Set<string>(addedStaffIds);
      if (personnelChanged) {
        usersToNotify.add(newPersonnelId);
      }

      if (usersToNotify.size > 0) {
        // Get booker info for notifications
        let bookerInfo: { id: string; fullName: string; profileImageUrl: string | null } | null = null;
        const bookedById = data.bookedById || event.bookedById;
        if (bookedById) {
          const booker = await prisma.user.findUnique({
            where: { id: bookedById },
            select: { id: true, fullName: true, profileImageUrl: true },
          });
          bookerInfo = booker;
        }

        const notifications = Array.from(usersToNotify).map((recipientId: string) => ({
          userId: recipientId,
          type: 'event-mention',
          title: 'Event Involved',
          message: `${bookerInfo?.fullName || 'Someone'} added you to event: ${event.title}`,
          eventId: event.id,
          bookedByUserId: bookerInfo?.id,
          bookedByName: bookerInfo?.fullName,
          bookedByProfileUrl: bookerInfo?.profileImageUrl,
        }));

        await prisma.notification.createMany({
          data: notifications,
        });
      }
    }
  } catch (notifError) {
    console.error('Failed to create notifications:', notifError);
  }

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

  return NextResponse.json({ ...event, staffInvolvedNames, staffInvolvedUsers, bookedByUser, bookedPersonnelUser });
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
