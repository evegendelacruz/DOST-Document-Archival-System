import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Test endpoint to verify activity logging works
export async function GET() {
  try {
    // Get all logs from the database
    const logs = await prisma.userLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: {
        user: {
          select: { fullName: true, email: true }
        }
      }
    });

    // Get count of logs by action type
    const counts = await prisma.userLog.groupBy({
      by: ['action'],
      _count: { action: true }
    });

    return NextResponse.json({
      message: 'Database connection OK',
      totalLogs: logs.length,
      countsByAction: counts,
      recentLogs: logs.map(log => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceTitle: log.resourceTitle,
        timestamp: log.timestamp,
        user: log.user?.fullName || 'Unknown'
      }))
    });
  } catch (error) {
    console.error('Test log error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Try to create a test log entry
    const log = await prisma.userLog.create({
      data: {
        userId,
        action: 'CREATE',
        resourceType: 'DOCUMENT',
        resourceTitle: 'Test Document ' + new Date().toISOString(),
        details: JSON.stringify({ test: true }),
      }
    });

    return NextResponse.json({
      message: 'Test log created successfully',
      log
    });
  } catch (error) {
    console.error('Test log creation error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
