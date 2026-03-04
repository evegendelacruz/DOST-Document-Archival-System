import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET — leaderboard: all approved users merged with their best score, top 10
export async function GET() {
  const [logs, allUsers] = await Promise.all([
    prisma.userLog.findMany({
      where: { resourceType: 'SNAKE_SCORE' },
      select: { userId: true, details: true },
    }),
    prisma.user.findMany({
      where: { isApproved: true },
      select: { id: true, fullName: true, profileImageUrl: true },
    }),
  ]);

  // Build best-score map from logs
  const scoreMap = new Map<string, number>();
  for (const log of logs) {
    let score = 0;
    try { score = JSON.parse(log.details || '{}').score || 0; } catch { /* ignore */ }
    const prev = scoreMap.get(log.userId) ?? 0;
    if (score > prev) scoreMap.set(log.userId, score);
  }

  // Merge all users with their best score (0 if never played)
  const leaderboard = allUsers
    .map(u => ({
      userId: u.id,
      fullName: u.fullName,
      profileImageUrl: u.profileImageUrl ?? null,
      score: scoreMap.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return NextResponse.json(leaderboard);
}

// POST — record a score for the authenticated user
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { score } = await req.json();
  if (typeof score !== 'number' || score <= 0) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
  }

  await prisma.userLog.create({
    data: {
      userId,
      action: 'SNAKE_SCORE',
      resourceType: 'SNAKE_SCORE',
      resourceTitle: String(score),
      details: JSON.stringify({ score }),
    },
  });

  return NextResponse.json({ ok: true });
}
