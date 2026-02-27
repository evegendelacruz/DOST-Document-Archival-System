import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();

  const updateData: { read?: boolean; inviteStatus?: string } = {};
  if (data.read !== undefined) updateData.read = data.read;
  if (data.inviteStatus !== undefined) updateData.inviteStatus = data.inviteStatus;

  const notification = await prisma.notification.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(notification);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.notification.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
