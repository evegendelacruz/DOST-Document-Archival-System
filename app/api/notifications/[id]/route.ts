import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();

  const notification = await prisma.notification.update({
    where: { id },
    data: {
      read: data.read ?? true,
    },
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
