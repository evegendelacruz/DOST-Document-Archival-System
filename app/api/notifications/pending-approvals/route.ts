import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/activity-log';

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can see pending approval notifications
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ success: true, pendingCount: 0, message: 'Only admins can view pending approvals' });
    }

    const pendingUsers = await prisma.user.findMany({
      where: { isApproved: false, isBlocked: false },
      select: {
        id: true,
        fullName: true,
        email: true,
        profileImageUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingCount = pendingUsers.length;

    if (pendingCount > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'pending_approval',
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      const latestPendingUser = pendingUsers[0];
      const title = `${pendingCount} User${pendingCount > 1 ? 's' : ''} Awaiting Approval`;
      const message = pendingCount === 1
        ? `${latestPendingUser.fullName} is waiting for account approval.`
        : `${latestPendingUser.fullName} and ${pendingCount - 1} other${pendingCount > 2 ? 's' : ''} are waiting for account approval.`;

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId,
            type: 'pending_approval',
            title,
            message,
            bookedByProfileUrl: latestPendingUser.profileImageUrl || null,
            bookedByName: latestPendingUser.fullName,
            bookedByUserId: latestPendingUser.id,
            read: false,
          },
        });
      } else {
        await prisma.notification.update({
          where: { id: existingNotification.id },
          data: {
            title,
            message,
            bookedByProfileUrl: latestPendingUser.profileImageUrl || null,
            bookedByName: latestPendingUser.fullName,
            bookedByUserId: latestPendingUser.id,
            read: false,
          },
        });
      }
    } else {
      // No pending users — clean up old notifications
      await prisma.notification.deleteMany({
        where: { userId, type: 'pending_approval' },
      });
    }

    return NextResponse.json({
      success: true,
      pendingCount,
      pendingUsers: pendingUsers.map(u => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        profileImageUrl: u.profileImageUrl,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to check pending approvals' }, { status: 500 });
  }
}
