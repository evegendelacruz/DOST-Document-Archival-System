import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-log';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const record = await prisma.archivalRecord.findUnique({ where: { id } });

  if (!record) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const userId = getUserIdFromRequest(req);

  // Get original record for logging
  const originalRecord = await prisma.archivalRecord.findUnique({ where: { id } });

  const record = await prisma.archivalRecord.update({
    where: { id },
    data,
  });

  // Log activity
  if (userId && originalRecord) {
    const changedFields = Object.keys(data).filter(
      (key) => data[key] !== (originalRecord as Record<string, unknown>)[key]
    );
    await logActivity({
      userId,
      action: 'UPDATE',
      resourceType: 'ARCHIVAL_RECORD',
      resourceId: record.id,
      resourceTitle: record.title,
      details: { changedFields },
    });
  }

  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = getUserIdFromRequest(req);

  // Get record before deletion for logging
  const record = await prisma.archivalRecord.findUnique({ where: { id } });

  await prisma.archivalRecord.delete({ where: { id } });

  // Log activity
  if (userId && record) {
    await logActivity({
      userId,
      action: 'DELETE',
      resourceType: 'ARCHIVAL_RECORD',
      resourceId: id,
      resourceTitle: record.title,
      details: { company: record.company },
    });
  }

  return NextResponse.json({ success: true });
}
