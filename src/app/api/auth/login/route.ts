import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const DEMO_USERS: Record<string, any> = {
  BA: {
    id: 'ba-demo-user-id',
    name: 'Business Analyst (Author)',
    email: 'ba@cais.com',
    role: 'BA',
    isActive: true,
  },
  REVIEWER: {
    id: 'reviewer-demo-user-id',
    name: 'Reviewer / Lead',
    email: 'reviewer@cais.com',
    role: 'REVIEWER',
    isActive: true,
  },
  ADMIN: {
    id: 'admin-demo-user-id',
    name: 'System Administrator',
    email: 'admin@cais.com',
    role: 'ADMIN',
    isActive: true,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { email, password, demoRole } = await req.json();

    let user: any = null;

    if (demoRole) {
      const targetRole = (String(demoRole).toUpperCase() as 'BA' | 'REVIEWER' | 'ADMIN') || 'BA';
      const targetEmail = DEMO_USERS[targetRole]?.email || 'ba@cais.com';
      
      try {
        user = await db.user.findUnique({ where: { email: targetEmail } });
      } catch (e) {
        console.warn('DB lookup failed during demo login:', e);
      }

      if (!user) {
        user = DEMO_USERS[targetRole] || DEMO_USERS.BA;
      }
    } else {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      const cleanEmail = email.toLowerCase().trim();

      try {
        user = await db.user.findUnique({ where: { email: cleanEmail } });
      } catch (e) {
        console.warn('DB lookup failed during login:', e);
      }

      if (!user) {
        // Fallback for standard demo login credentials if DB is unseeded
        if (cleanEmail === 'ba@cais.com' && (password === 'password123' || password === 'ba')) {
          user = DEMO_USERS.BA;
        } else if (cleanEmail === 'reviewer@cais.com' && (password === 'password123' || password === 'reviewer')) {
          user = DEMO_USERS.REVIEWER;
        } else if (cleanEmail === 'admin@cais.com' && (password === 'password123' || password === 'admin')) {
          user = DEMO_USERS.ADMIN;
        }
      } else {
        const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
        if (!isPasswordValid) {
          return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }
      }
    }

    if (!user || user.isActive === false) {
      return NextResponse.json({ error: 'User account inactive or not found' }, { status: 403 });
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'BA' | 'REVIEWER' | 'ADMIN',
    };

    const token = signToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      user: tokenPayload,
      token,
    });

    response.cookies.set('cais_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
