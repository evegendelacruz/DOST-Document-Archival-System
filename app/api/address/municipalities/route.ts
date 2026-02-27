import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provinceId = searchParams.get('provinceId');

  const where: Record<string, unknown> = {};
  if (provinceId) where.provinceId = provinceId;

  const municipalities = await prisma.municipality.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(municipalities);
}
