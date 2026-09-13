import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, demoRole } = await req.json();

    let user;

    // Handle Quick Demo Role Switcher on login screen
    if (demoRole) {
      const roleEmailMap: Record<string, string> = {
        BA: 'ba@cais.com',
        REVIEWER: 'reviewer@cais.com',
        ADMIN: 'admin@cais.com',
      };
      const targetEmail = roleEmailMap[demoRole] || 'ba@cais.com';
      user = await db.user.findUnique({ where: { email: targetEmail } });
      
      if (!user) {
        // Auto-provision demo user on demand if db is unseeded
        const passwordHash = bcrypt.hashSync('password123', 10);
        user = await db.user.create({
          data: {
            email: targetEmail,
            name: demoRole === 'BA' ? 'Business Analyst (Author)' : demoRole === 'REVIEWER' ? 'Reviewer / Lead' : 'System Administrator',
            role: demoRole,
            passwordHash,
            isActive: true,
          },
        });
      }
    } else {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }
      user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
      
      // Auto-provision demo user for standard email input if unseeded
      if (!user && (email.toLowerCase() === 'ba@cais.com' || email.toLowerCase() === 'reviewer@cais.com' || email.toLowerCase() === 'admin@cais.com')) {
        const role = email.toLowerCase().includes('admin') ? 'ADMIN' : email.toLowerCase().includes('reviewer') ? 'REVIEWER' : 'BA';
        const passwordHash = bcrypt.hashSync('password123', 10);
        user = await db.user.create({
          data: {
            email: email.toLowerCase(),
            name: role === 'BA' ? 'Business Analyst (Author)' : role === 'REVIEWER' ? 'Reviewer / Lead' : 'System Administrator',
            role,
            passwordHash,
            isActive: true,
          },
        });
      }

      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
    }

    if (!user || !user.isActive) {
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

    // Set cookie
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
