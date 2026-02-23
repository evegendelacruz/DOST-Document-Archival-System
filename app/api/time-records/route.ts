import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const date = searchParams.get('date');
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  try {
    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;

    if (date) {
      const [y, m, d] = date.split('-').map(Number);
      const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
      where.date = { gte: startOfDay, lte: endOfDay };
    } else if (month) {
      const [y, m] = month.split('-').map(Number);
      where.date = {
        gte: new Date(Date.UTC(y, m - 1, 1)),
        lte: new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)),
      };
    } else if (year) {
      const y = parseInt(year);
      where.date = {
        gte: new Date(Date.UTC(y, 0, 1)),
        lte: new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999)),
      };
    }

    const records = await prisma.timeRecord.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('[Time Records API] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch time records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId, action } = data;

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
    }

    const validActions = ['AM_TIME_IN', 'AM_TIME_OUT', 'PM_TIME_IN', 'PM_TIME_OUT'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Build a UTC date range for today so it matches the DATE column
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
    const todayDate = startOfDay; // used as the stored date value

    // Use findFirst instead of findUnique — works with all Prisma adapter drivers
    let record = await prisma.timeRecord.findFirst({
      where: {
        userId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    console.log('[Time Records API] Existing record:', record);

    const currentTime = new Date();

    if (action === 'AM_TIME_IN') {
      if (record?.amTimeIn) {
        return NextResponse.json({ error: 'AM Time In already recorded' }, { status: 400 });
      }
      if (record) {
        record = await prisma.timeRecord.update({
          where: { id: record.id },
          data: { amTimeIn: currentTime },
        });
      } else {
        record = await prisma.timeRecord.create({
          data: { userId, date: todayDate, amTimeIn: currentTime },
        });
      }
    } else if (action === 'AM_TIME_OUT') {
      if (!record?.amTimeIn) {
        return NextResponse.json({ error: 'Must time in first' }, { status: 400 });
      }
      if (record.amTimeOut) {
        return NextResponse.json({ error: 'AM Time Out already recorded' }, { status: 400 });
      }
      record = await prisma.timeRecord.update({
        where: { id: record.id },
        data: { amTimeOut: currentTime },
      });
    } else if (action === 'PM_TIME_IN') {
      if (record?.pmTimeIn) {
        return NextResponse.json({ error: 'PM Time In already recorded' }, { status: 400 });
      }
      if (record) {
        record = await prisma.timeRecord.update({
          where: { id: record.id },
          data: { pmTimeIn: currentTime },
        });
      } else {
        record = await prisma.timeRecord.create({
          data: { userId, date: todayDate, pmTimeIn: currentTime },
        });
      }
    } else if (action === 'PM_TIME_OUT') {
      if (!record?.pmTimeIn) {
        return NextResponse.json({ error: 'Must time in first' }, { status: 400 });
      }
      if (record.pmTimeOut) {
        return NextResponse.json({ error: 'PM Time Out already recorded' }, { status: 400 });
      }
      record = await prisma.timeRecord.update({
        where: { id: record.id },
        data: { pmTimeOut: currentTime },
      });
    }

    console.log('[Time Records API] Saved:', record);
    return NextResponse.json(record);

  } catch (error) {
    console.error('[Time Records API] POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to record time: ${errorMessage}` }, { status: 500 });
  }
}