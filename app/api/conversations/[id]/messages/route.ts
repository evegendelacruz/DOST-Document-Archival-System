import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/conversations/[id]/messages — fetch all messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId } },
  });
  if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    include: {
      sender: { select: { id: true, fullName: true, profileImageUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(messages);
}

// POST /api/conversations/[id]/messages — send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Message content required' }, { status: 400 });
  }

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId } },
  });
  if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: userId,
      content: content.trim(),
    },
    include: {
      sender: { select: { id: true, fullName: true, profileImageUrl: true } },
    },
  });

  // Update conversation's updatedAt for ordering
  await prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(message);
}
