import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const municipalityId = searchParams.get('municipalityId');

  const where: Record<string, unknown> = {};
  if (municipalityId) where.municipalityId = municipalityId;

  const barangays = await prisma.barangay.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(barangays);
}
