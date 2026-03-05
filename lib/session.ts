import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = '__dost_session';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signJwt(payload: { sub: string; role: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<{ sub: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { sub: string; role: string };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(clear = false) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: clear ? 0 : 60 * 60 * 24 * 7, // 7 days or immediate expiry
  };
}
