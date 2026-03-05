import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifyJwt } from '@/lib/session';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });

  const payload = await verifyJwt(token);
  if (!payload) return NextResponse.json({ authenticated: false }, { status: 401 });

  return NextResponse.json({ authenticated: true });
}
