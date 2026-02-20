import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-log';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { userName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const records = await prisma.archivalRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const userId = getUserIdFromRequest(req);

  const record = await prisma.archivalRecord.create({ data });

  // Log activity
  if (userId) {
    await logActivity({
      userId,
      action: 'CREATE',
      resourceType: 'ARCHIVAL_RECORD',
      resourceId: record.id,
      resourceTitle: record.title,
      details: { company: record.company, year: record.year },
    });
  }

  return NextResponse.json(record, { status: 201 });
}
