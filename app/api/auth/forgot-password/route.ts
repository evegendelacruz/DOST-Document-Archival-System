import { NextRequest, NextResponse, after } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email';


export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
  }

  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Save OTP to user record
  await prisma.user.update({
    where: { email },
    data: {
      resetOtp: otp,
      resetOtpExpiresAt: expiresAt,
    },
  });

  // Send email after response (keeps function alive but responds instantly)
  after(async () => {
    await sendOtpEmail(email, otp);
  });

  return NextResponse.json({ message: 'Verification code sent to your email' });
}
