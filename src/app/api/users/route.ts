import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, and, or, desc, sql } from 'drizzle-orm';

const VALID_ROLES = ['STUDENT', 'TEACHER', 'SCHOOL', 'ADMIN'];
const VALID_TEACHING_LEVELS = ['Pre-Primary', 'Primary', 'Secondary', 'Higher Secondary', 'Professor'];

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
        currentTown: users.currentTown,
        phone: users.phone,
        socialMediaLinks: users.socialMediaLinks,
        class: users.class,
        schoolHistory: users.schoolHistory,
        aboutYourself: users.aboutYourself,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Parse JSON fields
      const userData = user[0];
      return NextResponse.json({
        ...userData,
        socialMediaLinks: userData.socialMediaLinks ? JSON.parse(userData.socialMediaLinks as string) : null,
        schoolHistory: userData.schoolHistory ? JSON.parse(userData.schoolHistory as string) : null,
      });
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
      currentTown: users.currentTown,
      phone: users.phone,
      socialMediaLinks: users.socialMediaLinks,
      class: users.class,
      schoolHistory: users.schoolHistory,
      aboutYourself: users.aboutYourself,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
      .from(users)
      .where(whereCondition)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Parse JSON fields for all users
    const parsedResults = results.map(user => ({
      ...user,
      socialMediaLinks: user.socialMediaLinks ? JSON.parse(user.socialMediaLinks as string) : null,
      schoolHistory: user.schoolHistory ? JSON.parse(user.schoolHistory as string) : null,
    }));

    return NextResponse.json(parsedResults);

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
    const { email, name, role, passwordHash, avatar, coverImage, bio, schoolId, currentTown, phone, socialMediaLinks, class: userClass, schoolHistory, aboutYourself } = body;

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

    // Validate JSON fields
    if (socialMediaLinks !== undefined && socialMediaLinks !== null) {
      if (typeof socialMediaLinks !== 'object' || Array.isArray(socialMediaLinks)) {
        return NextResponse.json({ 
          error: "socialMediaLinks must be a valid object",
          code: "INVALID_SOCIAL_MEDIA_LINKS" 
        }, { status: 400 });
      }
    }

    if (schoolHistory !== undefined && schoolHistory !== null) {
      if (!Array.isArray(schoolHistory)) {
        return NextResponse.json({ 
          error: "schoolHistory must be an array",
          code: "INVALID_SCHOOL_HISTORY" 
        }, { status: 400 });
      }
    }

    const now = new Date().toISOString();

    // CRITICAL: Do NOT include 'id' field - SQLite will auto-generate it
    const insertData: any = {
      email: sanitizedEmail,
      passwordHash,
      name: sanitizedName,
      role,
      createdAt: now,
      updatedAt: now,
    };

    // Only add optional fields if they have values
    if (avatar) insertData.avatar = avatar;
    if (coverImage) insertData.coverImage = coverImage;
    if (bio) insertData.bio = bio;
    if (schoolId) insertData.schoolId = parseInt(schoolId);
    if (currentTown) insertData.currentTown = currentTown.trim();
    if (phone) insertData.phone = phone.trim();
    if (socialMediaLinks) insertData.socialMediaLinks = JSON.stringify(socialMediaLinks);
    if (userClass) insertData.class = userClass.trim();
    if (schoolHistory) insertData.schoolHistory = JSON.stringify(schoolHistory);
    if (aboutYourself) insertData.aboutYourself = aboutYourself.trim();

    const newUser = await db.insert(users)
      .values(insertData)
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        coverImage: users.coverImage,
        role: users.role,
        bio: users.bio,
        schoolId: users.schoolId,
        currentTown: users.currentTown,
        phone: users.phone,
        socialMediaLinks: users.socialMediaLinks,
        class: users.class,
        schoolHistory: users.schoolHistory,
        aboutYourself: users.aboutYourself,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    // Parse JSON fields in response
    const userData = newUser[0];
    return NextResponse.json({
      ...userData,
      socialMediaLinks: userData.socialMediaLinks ? JSON.parse(userData.socialMediaLinks as string) : null,
      schoolHistory: userData.schoolHistory ? JSON.parse(userData.schoolHistory as string) : null,
    }, { status: 201 });

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
    const { email, name, role, passwordHash, avatar, coverImage, bio, schoolId, currentTown, phone, socialMediaLinks, class: userClass, schoolHistory, aboutYourself } = body;

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

    // Validate JSON fields
    if (socialMediaLinks !== undefined && socialMediaLinks !== null) {
      if (typeof socialMediaLinks !== 'object' || Array.isArray(socialMediaLinks)) {
        return NextResponse.json({ 
          error: "socialMediaLinks must be a valid object",
          code: "INVALID_SOCIAL_MEDIA_LINKS" 
        }, { status: 400 });
      }
    }

    if (schoolHistory !== undefined && schoolHistory !== null) {
      if (!Array.isArray(schoolHistory)) {
        return NextResponse.json({ 
          error: "schoolHistory must be an array",
          code: "INVALID_SCHOOL_HISTORY" 
        }, { status: 400 });
      }
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
    if (currentTown !== undefined) updates.currentTown = currentTown ? currentTown.trim() : null;
    if (phone !== undefined) updates.phone = phone ? phone.trim() : null;
    if (socialMediaLinks !== undefined) updates.socialMediaLinks = socialMediaLinks ? JSON.stringify(socialMediaLinks) : null;
    if (userClass !== undefined) updates.class = userClass ? userClass.trim() : null;
    if (schoolHistory !== undefined) updates.schoolHistory = schoolHistory ? JSON.stringify(schoolHistory) : null;
    if (aboutYourself !== undefined) updates.aboutYourself = aboutYourself ? aboutYourself.trim() : null;

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
        currentTown: users.currentTown,
        phone: users.phone,
        socialMediaLinks: users.socialMediaLinks,
        class: users.class,
        schoolHistory: users.schoolHistory,
        aboutYourself: users.aboutYourself,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    // Parse JSON fields in response
    const userData = updated[0];
    return NextResponse.json({
      ...userData,
      socialMediaLinks: userData.socialMediaLinks ? JSON.parse(userData.socialMediaLinks as string) : null,
      schoolHistory: userData.schoolHistory ? JSON.parse(userData.schoolHistory as string) : null,
    });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
    const { teachingExperience, skills, teachingSubjects } = body;

    // Build update object with only teacher-specific fields
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    // Validate and update teachingExperience
    if (teachingExperience !== undefined) {
      if (teachingExperience !== null) {
        if (!Array.isArray(teachingExperience)) {
          return NextResponse.json({ 
            error: "teachingExperience must be an array",
            code: "INVALID_TEACHING_EXPERIENCE" 
          }, { status: 400 });
        }

        // Validate each experience object
        for (let i = 0; i < teachingExperience.length; i++) {
          const exp = teachingExperience[i];
          if (!exp.schoolName || !exp.designation || !exp.teachingLevel || !exp.from || !exp.to) {
            return NextResponse.json({ 
              error: `Teaching experience at index ${i} must have schoolName, designation, teachingLevel, from, and to`,
              code: "INVALID_EXPERIENCE_STRUCTURE" 
            }, { status: 400 });
          }

          if (!VALID_TEACHING_LEVELS.includes(exp.teachingLevel)) {
            return NextResponse.json({ 
              error: `Invalid teachingLevel at index ${i}. Must be one of: ${VALID_TEACHING_LEVELS.join(', ')}`,
              code: "INVALID_TEACHING_LEVEL" 
            }, { status: 400 });
          }
        }

        updates.teachingExperience = JSON.stringify(teachingExperience);
      } else {
        updates.teachingExperience = null;
      }
    }

    // Validate and update skills
    if (skills !== undefined) {
      if (skills !== null) {
        if (!Array.isArray(skills)) {
          return NextResponse.json({ 
            error: "skills must be an array",
            code: "INVALID_SKILLS" 
          }, { status: 400 });
        }

        // Validate all items are strings
        if (!skills.every(skill => typeof skill === 'string')) {
          return NextResponse.json({ 
            error: "All skills must be strings",
            code: "INVALID_SKILL_TYPE" 
          }, { status: 400 });
        }

        updates.skills = JSON.stringify(skills);
      } else {
        updates.skills = null;
      }
    }

    // Validate and update teachingSubjects
    if (teachingSubjects !== undefined) {
      if (teachingSubjects !== null) {
        if (!Array.isArray(teachingSubjects)) {
          return NextResponse.json({ 
            error: "teachingSubjects must be an array",
            code: "INVALID_TEACHING_SUBJECTS" 
          }, { status: 400 });
        }

        // Validate all items are strings
        if (!teachingSubjects.every(subject => typeof subject === 'string')) {
          return NextResponse.json({ 
            error: "All teaching subjects must be strings",
            code: "INVALID_SUBJECT_TYPE" 
          }, { status: 400 });
        }

        updates.teachingSubjects = JSON.stringify(teachingSubjects);
      } else {
        updates.teachingSubjects = null;
      }
    }

    const updated = await db.update(users)
      .set(updates)
      .where(eq(users.id, parseInt(id)))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        role: users.role,
        bio: users.bio,
        teachingExperience: users.teachingExperience,
        skills: users.skills,
        teachingSubjects: users.teachingSubjects,
        updatedAt: users.updatedAt,
      });

    // Parse JSON fields in response
    const userData = updated[0];
    return NextResponse.json({
      ...userData,
      teachingExperience: userData.teachingExperience ? JSON.parse(userData.teachingExperience as string) : null,
      skills: userData.skills ? JSON.parse(userData.skills as string) : null,
      teachingSubjects: userData.teachingSubjects ? JSON.parse(userData.teachingSubjects as string) : null,
    });

  } catch (error) {
    console.error('PATCH error:', error);
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