import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();

  if (!email || !otp) {
    return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
  }

  if (!user.resetOtp || !user.resetOtpExpiresAt) {
    return NextResponse.json({ error: 'No verification code requested' }, { status: 400 });
  }

  if (new Date() > user.resetOtpExpiresAt) {
    return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
  }

  if (user.resetOtp !== otp) {
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
  }

  return NextResponse.json({ message: 'Verification successful' });
}
