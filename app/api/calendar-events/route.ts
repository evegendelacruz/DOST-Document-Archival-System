import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const events = await prisma.calendarEvent.findMany({
    orderBy: { date: 'asc' },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const data = await req.json();

  const event = await prisma.calendarEvent.create({ data });

  return NextResponse.json(event, { status: 201 });
}
