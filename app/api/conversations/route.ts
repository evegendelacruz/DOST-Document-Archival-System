import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/conversations — list conversations for current user
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, fullName: true, profileImageUrl: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { select: { id: true, fullName: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(conversations);
}

// POST /api/conversations — create a new conversation (direct or group)
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { participantIds, name, isGroup } = await req.json();

  if (!participantIds || participantIds.length === 0) {
    return NextResponse.json({ error: 'Participant IDs required' }, { status: 400 });
  }

  const allParticipantIds: string[] = [...new Set([userId, ...participantIds])];

  // For direct (1-on-1) messages, reuse existing conversation
  if (!isGroup && allParticipantIds.length === 2) {
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: allParticipantIds[0] } } },
          { participants: { some: { userId: allParticipantIds[1] } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, fullName: true, profileImageUrl: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (existing) return NextResponse.json(existing);
  }

  const conversation = await prisma.conversation.create({
    data: {
      name: isGroup ? (name || 'Group Chat') : null,
      isGroup: isGroup ?? false,
      participants: {
        create: allParticipantIds.map((uid: string) => ({ userId: uid })),
      },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, fullName: true, profileImageUrl: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  return NextResponse.json(conversation);
}
