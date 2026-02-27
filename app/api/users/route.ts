import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      contactNo: true,
      role: true,
      isApproved: true,
      createdAt: true,
      profileImageUrl: true,
      birthday: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Prisma 7 may return DateTime(@db.Date) as a Date object, ISO string, or
  // raw number (ms since epoch). CockroachDB also stores Philippine dates as
  // UTC−8h (e.g. May 21 PH → "May 20T16:00Z"). Adding 12 h before slicing
  // corrects the shift for any UTC offset up to ±12 h.
  const formatted = users.map(u => {
    let birthday: string | null = null;
    if (u.birthday != null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ms = new Date(u.birthday as any).getTime();
      birthday = new Date(ms + 12 * 3600 * 1000).toISOString().slice(0, 10);
    }
    return { ...u, birthday };
  });

  return NextResponse.json(formatted);
}
