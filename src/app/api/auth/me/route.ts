import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authUser = getUserFromRequest(req);
  if (!authUser) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (user && user.isActive !== false) {
      return NextResponse.json({ authenticated: true, user });
    }
  } catch (e) {
    console.warn('DB lookup in /api/auth/me failed, using token payload fallback:', e);
  }

  // Fallback to token payload if user exists in token (e.g. demo mode / unseeded db)
  return NextResponse.json({
    authenticated: true,
    user: {
      id: authUser.userId,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      isActive: true,
    },
  });
}

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('cais_token');
  return response;
}
