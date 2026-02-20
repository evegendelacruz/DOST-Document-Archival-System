import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-log';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const userId = getUserIdFromRequest(req);

  // Get original pin for logging
  const originalPin = await prisma.mapPin.findUnique({ where: { id } });

  const pin = await prisma.mapPin.update({
    where: { id },
    data,
  });

  // Log activity
  if (userId && originalPin) {
    const changedFields = Object.keys(data).filter(
      (key) => data[key] !== (originalPin as Record<string, unknown>)[key]
    );
    await logActivity({
      userId,
      action: 'UPDATE',
      resourceType: 'MAP_PIN',
      resourceId: pin.id,
      resourceTitle: pin.label,
      details: { changedFields, program: pin.program },
    });
  }

  return NextResponse.json(pin);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = getUserIdFromRequest(req);

  // Get pin before deletion for logging
  const pin = await prisma.mapPin.findUnique({ where: { id } });

  await prisma.mapPin.delete({ where: { id } });

  // Log activity
  if (userId && pin) {
    await logActivity({
      userId,
      action: 'DELETE',
      resourceType: 'MAP_PIN',
      resourceId: id,
      resourceTitle: pin.label,
      details: { program: pin.program, district: pin.district },
    });
  }

  return NextResponse.json({ success: true });
}
