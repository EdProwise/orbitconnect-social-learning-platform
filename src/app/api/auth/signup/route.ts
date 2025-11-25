import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { generateToken, setAuthCookie } from '@/lib/auth';

const VALID_ROLES = ['STUDENT', 'TEACHER', 'SCHOOL'] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, schoolId, bio } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        {
          error: 'Email, password, name, and role are required',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
          code: 'INVALID_ROLE',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters', code: 'WEAK_PASSWORD' },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, sanitizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered', code: 'EMAIL_EXISTS' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const now = new Date().toISOString();
    const newUser = await db
      .insert(users)
      .values({
        email: sanitizedEmail,
        passwordHash,
        name: name.trim(),
        role,
        bio: bio?.trim() || null,
        schoolId: schoolId ? parseInt(schoolId) : null,
        avatar: `https://i.pravatar.cc/150?u=${sanitizedEmail}`,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        avatar: users.avatar,
        bio: users.bio,
        schoolId: users.schoolId,
      });

    // Generate JWT token
    const token = await generateToken({
      userId: newUser[0].id,
      email: newUser[0].email,
      role: newUser[0].role as any,
    });

    // Set HTTP-only cookie
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: newUser[0],
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
