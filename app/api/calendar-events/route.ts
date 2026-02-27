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

  // Fetch invite statuses for all events from notifications
  const eventIds = events.map(e => e.id);
  const inviteNotifs = eventIds.length > 0
    ? await prisma.notification.findMany({
        where: { eventId: { in: eventIds }, type: 'event-invite' },
        select: { eventId: true, userId: true, inviteStatus: true },
      })
    : [];

  // Build a map: eventId -> { userId -> inviteStatus }
  const inviteStatusMap = new Map<string, Map<string, string>>();
  for (const n of inviteNotifs) {
    if (!n.eventId) continue;
    if (!inviteStatusMap.has(n.eventId)) inviteStatusMap.set(n.eventId, new Map());
    inviteStatusMap.get(n.eventId)!.set(n.userId, n.inviteStatus || 'pending');
  }

  // Add user details and attendee statuses to each event
  const eventsWithUsers = events.map(event => {
    const statusMap = inviteStatusMap.get(event.id) || new Map<string, string>();
    return {
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
      // inviteStatuses: array of { userId, status } for all invited staff
      inviteStatuses: (event.staffInvolvedIds || []).map(id => ({
        userId: id,
        status: statusMap.get(id) || 'pending',
      })),
    };
  });

  return NextResponse.json(eventsWithUsers);
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const userId = getUserIdFromRequest(req);

    const staffInvolvedIds: string[] = data.staffInvolvedIds || [];

    const eventData = {
      title: data.title as string,
      date: data.date as string,
      time: data.time as string | undefined,
      location: data.location as string,
      bookedBy: data.bookedBy as string | undefined,
      bookedService: data.bookedService as string | undefined,
      bookedPersonnel: data.bookedPersonnel as string | undefined,
      priority: data.priority as string | undefined,
      staffInvolved: data.staffInvolved as string | undefined,
      staffInvolvedIds: staffInvolvedIds,
      bookedById: data.bookedById ? (data.bookedById as string) : undefined,
      bookedPersonnelId: data.bookedPersonnelId ? (data.bookedPersonnelId as string) : undefined,
    };

    const event = await prisma.calendarEvent.create({ data: eventData });

    // Fetch user details
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
      if (data.bookedById) bookedByUser = userMap.get(data.bookedById) || null;
      if (data.bookedPersonnelId) bookedPersonnelUser = userMap.get(data.bookedPersonnelId) || null;
    }

    // Send event-invite notifications (non-blocking)
    try {
      // Both staff involved and booked personnel get invite notifications with RSVP
      const inviteRecipients = new Set<string>(staffInvolvedIds);
      if (data.bookedPersonnelId && !inviteRecipients.has(data.bookedPersonnelId)) {
        inviteRecipients.add(data.bookedPersonnelId);
      }

      let bookerInfo: { id: string; fullName: string; profileImageUrl: string | null } | null = null;
      if (data.bookedById) {
        bookerInfo = await prisma.user.findUnique({
          where: { id: data.bookedById },
          select: { id: true, fullName: true, profileImageUrl: true },
        });
      }

      const timeStr = data.time ? ` at ${data.time}` : '';
      const dateStr = data.date ? ` on ${new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : '';

      const notifications: {
        userId: string;
        type: string;
        title: string;
        message: string;
        eventId: string;
        inviteStatus?: string;
        bookedByUserId?: string;
        bookedByName?: string;
        bookedByProfileUrl?: string;
      }[] = [];

      // Invite notifications for all recipients (staff + booked personnel)
      for (const recipientId of inviteRecipients) {
        const isPersonnel = data.bookedPersonnelId === recipientId && !staffInvolvedIds.includes(recipientId);
        notifications.push({
          userId: recipientId,
          type: 'event-invite',
          title: 'Event Invitation',
          message: isPersonnel
            ? `${bookerInfo?.fullName || 'Someone'} assigned you to: ${event.title}${dateStr}${timeStr}`
            : `${bookerInfo?.fullName || 'Someone'} invited you to: ${event.title}${dateStr}${timeStr}`,
          eventId: event.id,
          inviteStatus: 'pending',
          bookedByUserId: bookerInfo?.id,
          bookedByName: bookerInfo?.fullName,
          bookedByProfileUrl: bookerInfo?.profileImageUrl,
        });
      }

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    } catch (notifError) {
      console.error('Failed to create notifications:', notifError);
    }

    if (userId) {
      await logActivity({
        userId,
        action: 'CREATE',
        resourceType: 'CALENDAR_EVENT',
        resourceId: event.id,
        resourceTitle: event.title,
        details: { date: event.date, time: event.time, location: event.location, priority: event.priority },
      });
    }

    return NextResponse.json({
      ...event,
      staffInvolvedNames,
      staffInvolvedUsers,
      bookedByUser,
      bookedPersonnelUser,
      inviteStatuses: [
        ...staffInvolvedIds.map(id => ({ userId: id, status: 'pending' })),
        ...(data.bookedPersonnelId && !staffInvolvedIds.includes(data.bookedPersonnelId)
          ? [{ userId: data.bookedPersonnelId, status: 'pending' }]
          : []),
      ],
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
