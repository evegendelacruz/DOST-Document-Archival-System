import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fullName = searchParams.get('fullName');

  if (!fullName || fullName.trim().length < 2) {
    return NextResponse.json({ exists: false });
  }

  const user = await prisma.user.findFirst({
    where: { fullName: { equals: fullName.trim(), mode: 'insensitive' } },
  });

  return NextResponse.json({ exists: !!user });
}
