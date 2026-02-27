import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const permission = await prisma.userPermission.findUnique({
    where: { userId: id },
  });

  if (!permission) {
    // Return default permissions if none exist
    return NextResponse.json({
      userId: id,
      canAccessSetup: true,
      canAccessCest: true,
      canAccessMaps: true,
      canAccessCalendar: true,
      canAccessArchival: true,
      canManageUsers: false,
    });
  }

  return NextResponse.json(permission);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const permission = await prisma.userPermission.upsert({
    where: { userId: id },
    update: {
      canAccessSetup: body.canAccessSetup,
      canAccessCest: body.canAccessCest,
      canAccessMaps: body.canAccessMaps,
      canAccessCalendar: body.canAccessCalendar,
      canAccessArchival: body.canAccessArchival,
      canManageUsers: body.canManageUsers,
    },
    create: {
      userId: id,
      canAccessSetup: body.canAccessSetup ?? true,
      canAccessCest: body.canAccessCest ?? true,
      canAccessMaps: body.canAccessMaps ?? true,
      canAccessCalendar: body.canAccessCalendar ?? true,
      canAccessArchival: body.canAccessArchival ?? true,
      canManageUsers: body.canManageUsers ?? false,
    },
  });

  return NextResponse.json(permission);
}
