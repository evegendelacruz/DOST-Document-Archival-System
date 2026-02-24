import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH /api/conversations/[id]/read — mark conversation as read for current user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await prisma.conversationParticipant.updateMany({
    where: { conversationId: id, userId },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
