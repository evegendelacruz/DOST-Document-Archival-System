import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const action = searchParams.get('action');
  const resourceType = searchParams.get('resourceType');
  const search = searchParams.get('search');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');

  console.log('[User Logs API] GET - params:', { userId, action, resourceType, search });

  const where: Record<string, unknown> = {};

  // Filter by specific user
  if (userId) {
    where.userId = userId;
  }

  // Filter by action type
  if (action && action !== 'all') {
    where.action = action.toUpperCase();
  }

  // Filter by resource type
  if (resourceType && resourceType !== 'all') {
    where.resourceType = resourceType.toUpperCase();
  }

  // Search in resourceTitle and user name
  if (search) {
    where.OR = [
      { resourceTitle: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const logs = await prisma.userLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          profileImageUrl: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: limit ? parseInt(limit, 10) : 100,
    skip: offset ? parseInt(offset, 10) : 0,
  });

  // Get statistics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const [totalCount, todayCount, weekCount] = await Promise.all([
    prisma.userLog.count({ where }),
    prisma.userLog.count({
      where: {
        ...where,
        timestamp: { gte: startOfToday },
      },
    }),
    prisma.userLog.count({
      where: {
        ...where,
        timestamp: { gte: startOfWeek },
      },
    }),
  ]);

  console.log('[User Logs API] Returning', logs.length, 'logs, stats:', { totalCount, todayCount, weekCount });

  return NextResponse.json({
    logs,
    stats: {
      total: totalCount,
      today: todayCount,
      thisWeek: weekCount,
    },
  });
}

export async function POST(req: NextRequest) {
  const data = await req.json();

  const { userId, action, resourceType, resourceId, resourceTitle, details } = data;

  if (!userId || !action || !resourceType) {
    return NextResponse.json(
      { error: 'userId, action, and resourceType are required' },
      { status: 400 }
    );
  }

  const log = await prisma.userLog.create({
    data: {
      userId,
      action,
      resourceType,
      resourceId,
      resourceTitle,
      details: details ? JSON.stringify(details) : null,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return NextResponse.json(log, { status: 201 });
}
