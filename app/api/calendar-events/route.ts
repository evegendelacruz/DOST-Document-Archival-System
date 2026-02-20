import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-log';

export async function GET() {
  const events = await prisma.calendarEvent.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Collect all user IDs we need to fetch (staff + bookedBy + bookedPersonnel)
  const allStaffIds = [...new Set(events.flatMap(e => e.staffInvolvedIds || []))];
  const allBookedByIds = [...new Set(events.map(e => e.bookedById).filter(Boolean))] as string[];
  const allPersonnelIds = [...new Set(events.map(e => e.bookedPersonnelId).filter(Boolean))] as string[];
  const allUserIds = [...new Set([...allStaffIds, ...allBookedByIds, ...allPersonnelIds])];

  const allUsers = allUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: allUserIds } },
        select: { id: true, fullName: true, profileImageUrl: true },
      })
    : [];

  const userMap = new Map(allUsers.map(u => [u.id, u]));

  // Add user details to each event
  const eventsWithUsers = events.map(event => ({
    ...event,
    staffInvolvedNames: (event.staffInvolvedIds || [])
      .map(id => userMap.get(id)?.fullName)
      .filter(Boolean)
      .join(', ') || event.staffInvolved || 'N/A',
    staffInvolvedUsers: (event.staffInvolvedIds || [])
      .map(id => userMap.get(id))
      .filter(Boolean),
    bookedByUser: event.bookedById ? userMap.get(event.bookedById) || null : null,
    bookedPersonnelUser: event.bookedPersonnelId ? userMap.get(event.bookedPersonnelId) || null : null,
  }));

  return NextResponse.json(eventsWithUsers);
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const userId = getUserIdFromRequest(req);

    // Extract staffInvolvedIds before creating
    const staffInvolvedIds: string[] = data.staffInvolvedIds || [];

    // Build event data
    const eventData = {
      title: data.title as string,
      date: data.date as string,
      location: data.location as string,
      bookedBy: data.bookedBy as string | undefined,
      bookedService: data.bookedService as string | undefined,
      bookedPersonnel: data.bookedPersonnel as string | undefined,
      priority: data.priority as string | undefined,
      staffInvolved: data.staffInvolved as string | undefined,
      staffInvolvedIds: (data.staffInvolvedIds || []) as string[],
      bookedById: data.bookedById ? (data.bookedById as string) : undefined,
      bookedPersonnelId: data.bookedPersonnelId ? (data.bookedPersonnelId as string) : undefined,
    };

    const event = await prisma.calendarEvent.create({ data: eventData });

    // Get user details for response (staff + bookedBy + bookedPersonnel)
    const userIdsToFetch = new Set<string>(staffInvolvedIds);
    if (data.bookedById) userIdsToFetch.add(data.bookedById);
    if (data.bookedPersonnelId) userIdsToFetch.add(data.bookedPersonnelId);

    let staffInvolvedNames = 'N/A';
    let staffInvolvedUsers: { id: string; fullName: string; profileImageUrl: string | null }[] = [];
    let bookedByUser: { id: string; fullName: string; profileImageUrl: string | null } | null = null;
    let bookedPersonnelUser: { id: string; fullName: string; profileImageUrl: string | null } | null = null;

    if (userIdsToFetch.size > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: Array.from(userIdsToFetch) } },
        select: { id: true, fullName: true, profileImageUrl: true },
      });
      const userMap = new Map(users.map(u => [u.id, u]));

      staffInvolvedUsers = staffInvolvedIds.map(id => userMap.get(id)).filter(Boolean) as typeof staffInvolvedUsers;
      staffInvolvedNames = staffInvolvedUsers.map(u => u.fullName).join(', ') || 'N/A';

      if (data.bookedById) {
        bookedByUser = userMap.get(data.bookedById) || null;
      }
      if (data.bookedPersonnelId) {
        bookedPersonnelUser = userMap.get(data.bookedPersonnelId) || null;
      }
    }

    // Create notifications for mentioned users (non-blocking)
    try {
      // Collect all user IDs to notify (staff involved + booked personnel)
      const usersToNotify = new Set<string>(staffInvolvedIds);
      if (data.bookedPersonnelId) {
        usersToNotify.add(data.bookedPersonnelId);
      }

      if (usersToNotify.size > 0) {
        let bookerInfo: { id: string; fullName: string; profileImageUrl: string | null } | null = null;
        if (data.bookedById) {
          const booker = await prisma.user.findUnique({
            where: { id: data.bookedById },
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
    } catch (notifError) {
      console.error('Failed to create notifications:', notifError);
      // Don't fail the request if notifications fail
    }

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

    return NextResponse.json({ ...event, staffInvolvedNames, staffInvolvedUsers, bookedByUser, bookedPersonnelUser }, { status: 201 });
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
