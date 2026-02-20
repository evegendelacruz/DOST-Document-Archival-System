import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-log';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const program = searchParams.get('program');
  const district = searchParams.get('district');

  const where: Record<string, unknown> = {};
  if (program) where.program = program.toUpperCase();
  if (district) where.district = parseInt(district, 10);

  const pins = await prisma.mapPin.findMany({ where });

  return NextResponse.json(pins);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const userId = getUserIdFromRequest(req);

  const pin = await prisma.mapPin.create({ data });

  // Log activity
  if (userId) {
    await logActivity({
      userId,
      action: 'CREATE',
      resourceType: 'MAP_PIN',
      resourceId: pin.id,
      resourceTitle: pin.label,
      details: { program: pin.program, district: pin.district, lat: pin.lat, lng: pin.lng },
    });
  }

  return NextResponse.json(pin, { status: 201 });
}
