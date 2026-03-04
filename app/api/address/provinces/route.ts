import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET() {
  const provinces = await prisma.province.findMany({
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(provinces);
}
