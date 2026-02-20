import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Admins don't need approval, only staff users do
  if (!user.isApproved && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Your account is pending admin approval' }, { status: 403 });
  }

  // Log the user login
  await logActivity({
    userId: user.id,
    action: 'LOGIN',
    resourceType: 'AUTH',
    resourceTitle: 'User Login',
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    contactNo: user.contactNo,
    birthday: user.birthday,
    profileImageUrl: user.profileImageUrl,
  });
}
