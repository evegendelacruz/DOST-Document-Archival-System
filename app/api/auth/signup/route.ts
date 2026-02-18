import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { email, password, fullName, contactNo, birthday } = await req.json();

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: 'Email, password, and full name are required' }, { status: 400 });
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const existingName = await prisma.user.findFirst({
    where: { fullName: { equals: fullName.trim(), mode: 'insensitive' } },
  });
  if (existingName) {
    return NextResponse.json({ error: 'Full name already taken' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      contactNo: contactNo || null,
      birthday: birthday ? new Date(birthday) : null,
    },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    contactNo: user.contactNo,
    birthday: user.birthday,
    role: user.role,
    isApproved: user.isApproved,
  }, { status: 201 });
}
