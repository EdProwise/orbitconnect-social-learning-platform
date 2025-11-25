import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, and, or, desc, sql } from 'drizzle-orm';

const VALID_ROLES = ['STUDENT', 'TEACHER', 'SCHOOL', 'ADMIN'];

// Helper function to exclude passwordHash from results
function excludePasswordHash<T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single user by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const user = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        coverImage: users.coverImage,
        role: users.role,
        bio: users.bio,
        schoolId: users.schoolId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(user[0]);
    }

    // List users with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const schoolId = searchParams.get('schoolId');

    let conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    // Role filter
    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ 
          error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
          code: "INVALID_ROLE" 
        }, { status: 400 });
      }
      conditions.push(eq(users.role, role));
    }

    // School ID filter
    if (schoolId) {
      if (isNaN(parseInt(schoolId))) {
        return NextResponse.json({ 
          error: "School ID must be a valid integer",
          code: "INVALID_SCHOOL_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(users.schoolId, parseInt(schoolId)));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatar: users.avatar,
      coverImage: users.coverImage,
      role: users.role,
      bio: users.bio,
      schoolId: users.schoolId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
      .from(users)
      .where(whereCondition)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role, passwordHash, avatar, coverImage, bio, schoolId } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json({ 
        error: "Email is required",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ 
        error: "Role is required",
        code: "MISSING_ROLE" 
      }, { status: 400 });
    }

    if (!passwordHash) {
      return NextResponse.json({ 
        error: "Password hash is required",
        code: "MISSING_PASSWORD_HASH" 
      }, { status: 400 });
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ 
        error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();

    // Check if email already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, sanitizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ 
        error: "Email already exists",
        code: "EMAIL_EXISTS" 
      }, { status: 400 });
    }

    // Validate schoolId if provided
    if (schoolId !== undefined && schoolId !== null && isNaN(parseInt(schoolId))) {
      return NextResponse.json({ 
        error: "School ID must be a valid integer",
        code: "INVALID_SCHOOL_ID" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    const newUser = await db.insert(users)
      .values({
        email: sanitizedEmail,
        passwordHash,
        name: sanitizedName,
        avatar: avatar || null,
        coverImage: coverImage || null,
        role,
        bio: bio || null,
        schoolId: schoolId ? parseInt(schoolId) : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        coverImage: users.coverImage,
        role: users.role,
        bio: users.bio,
        schoolId: users.schoolId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json(newUser[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { email, name, role, passwordHash, avatar, coverImage, bio, schoolId } = body;

    // Validate role if provided
    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ 
        error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    // Check email uniqueness if email is being updated
    if (email && email !== existingUser[0].email) {
      const sanitizedEmail = email.trim().toLowerCase();
      const emailExists = await db.select()
        .from(users)
        .where(eq(users.email, sanitizedEmail))
        .limit(1);

      if (emailExists.length > 0) {
        return NextResponse.json({ 
          error: "Email already exists",
          code: "EMAIL_EXISTS" 
        }, { status: 400 });
      }
    }

    // Validate schoolId if provided
    if (schoolId !== undefined && schoolId !== null && isNaN(parseInt(schoolId))) {
      return NextResponse.json({ 
        error: "School ID must be a valid integer",
        code: "INVALID_SCHOOL_ID" 
      }, { status: 400 });
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (name !== undefined) updates.name = name.trim();
    if (role !== undefined) updates.role = role;
    if (passwordHash !== undefined) updates.passwordHash = passwordHash;
    if (avatar !== undefined) updates.avatar = avatar;
    if (coverImage !== undefined) updates.coverImage = coverImage;
    if (bio !== undefined) updates.bio = bio;
    if (schoolId !== undefined) updates.schoolId = schoolId ? parseInt(schoolId) : null;

    const updated = await db.update(users)
      .set(updates)
      .where(eq(users.id, parseInt(id)))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        coverImage: users.coverImage,
        role: users.role,
        bio: users.bio,
        schoolId: users.schoolId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json(updated[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatar: users.avatar,
      coverImage: users.coverImage,
      role: users.role,
      bio: users.bio,
      schoolId: users.schoolId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db.delete(users)
      .where(eq(users.id, parseInt(id)));

    return NextResponse.json({ 
      message: 'User deleted successfully',
      user: existingUser[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}