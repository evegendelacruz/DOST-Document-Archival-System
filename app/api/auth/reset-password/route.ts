import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';


export async function POST(req: NextRequest) {
  const { email, otp, newPassword } = await req.json();

  if (!email || !otp || !newPassword) {
    return NextResponse.json({ error: 'Email, verification code, and new password are required' }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
  }

  // Verify OTP before allowing reset
  if (!user.resetOtp || !user.resetOtpExpiresAt) {
    return NextResponse.json({ error: 'No verification code requested' }, { status: 400 });
  }

  if (new Date() > user.resetOtpExpiresAt) {
    return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
  }

  if (user.resetOtp !== otp) {
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password and clear OTP fields
  await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      resetOtp: null,
      resetOtpExpiresAt: null,
    },
  });

  return NextResponse.json({ message: 'Password reset successfully' });
}
