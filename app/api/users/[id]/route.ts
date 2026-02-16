import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      contactNo: true,
      birthday: true,
      role: true,
      profileImageUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};

  if (body.fullName !== undefined) updateData.fullName = body.fullName;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.contactNo !== undefined) updateData.contactNo = body.contactNo;
  if (body.birthday !== undefined) updateData.birthday = body.birthday ? new Date(body.birthday) : null;
  if (body.role !== undefined) updateData.role = body.role;
  if (body.profileImageUrl !== undefined) updateData.profileImageUrl = body.profileImageUrl;

  if (body.password && body.password.trim() !== '') {
    updateData.passwordHash = await bcrypt.hash(body.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      fullName: true,
      contactNo: true,
      birthday: true,
      role: true,
      profileImageUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
