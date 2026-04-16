import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const users = await prisma.user.findMany({
    where: {
      birthday: { not: null },
      isApproved: true,
      isBlocked: false,
    },
    select: {
      id: true,
      fullName: true,
      birthday: true,
      profileImageUrl: true,
    },
  });

  return NextResponse.json(users);
}
