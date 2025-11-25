import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { schools } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single school by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const school = await db.select()
        .from(schools)
        .where(eq(schools.id, parseInt(id)))
        .limit(1);

      if (school.length === 0) {
        return NextResponse.json({ 
          error: 'School not found',
          code: "SCHOOL_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(school[0], { status: 200 });
    }

    // List all schools with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(schools);

    if (search) {
      query = query.where(
        or(
          like(schools.name, `%${search}%`),
          like(schools.slug, `%${search}%`),
          like(schools.location, `%${search}%`)
        )
      );
    }

    const results = await query
      .orderBy(desc(schools.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
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
    const { name, slug, logo, coverImage, description, location, website, studentCount, teacherCount, establishedYear } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({ 
        error: "Name and slug are required",
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    // Validate name is not empty after trimming
    if (name.trim() === '') {
      return NextResponse.json({ 
        error: "Name cannot be empty",
        code: "INVALID_NAME" 
      }, { status: 400 });
    }

    // Validate slug is not empty after trimming
    if (slug.trim() === '') {
      return NextResponse.json({ 
        error: "Slug cannot be empty",
        code: "INVALID_SLUG" 
      }, { status: 400 });
    }

    // Check if slug already exists
    const existingSchool = await db.select()
      .from(schools)
      .where(eq(schools.slug, slug.trim()))
      .limit(1);

    if (existingSchool.length > 0) {
      return NextResponse.json({ 
        error: "A school with this slug already exists",
        code: "DUPLICATE_SLUG" 
      }, { status: 400 });
    }

    // Prepare insert data with defaults and timestamps
    const now = new Date().toISOString();
    const insertData: any = {
      name: name.trim(),
      slug: slug.trim(),
      studentCount: studentCount ?? 0,
      teacherCount: teacherCount ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    // Add optional fields if provided
    if (logo !== undefined && logo !== null) {
      insertData.logo = logo.trim();
    }
    if (coverImage !== undefined && coverImage !== null) {
      insertData.coverImage = coverImage.trim();
    }
    if (description !== undefined && description !== null) {
      insertData.description = description.trim();
    }
    if (location !== undefined && location !== null) {
      insertData.location = location.trim();
    }
    if (website !== undefined && website !== null) {
      insertData.website = website.trim();
    }
    if (establishedYear !== undefined && establishedYear !== null) {
      insertData.establishedYear = parseInt(establishedYear);
    }

    const newSchool = await db.insert(schools)
      .values(insertData)
      .returning();

    return NextResponse.json(newSchool[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    
    // Handle unique constraint violation
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ 
        error: "A school with this slug already exists",
        code: "DUPLICATE_SLUG" 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if school exists
    const existingSchool = await db.select()
      .from(schools)
      .where(eq(schools.id, parseInt(id)))
      .limit(1);

    if (existingSchool.length === 0) {
      return NextResponse.json({ 
        error: 'School not found',
        code: "SCHOOL_NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, slug, logo, coverImage, description, location, website, studentCount, teacherCount, establishedYear } = body;

    // If slug is being updated, check for uniqueness
    if (slug && slug.trim() !== existingSchool[0].slug) {
      const slugCheck = await db.select()
        .from(schools)
        .where(eq(schools.slug, slug.trim()))
        .limit(1);

      if (slugCheck.length > 0) {
        return NextResponse.json({ 
          error: "A school with this slug already exists",
          code: "DUPLICATE_SLUG" 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Add fields if provided
    if (name !== undefined) {
      if (name.trim() === '') {
        return NextResponse.json({ 
          error: "Name cannot be empty",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
      updateData.name = name.trim();
    }
    if (slug !== undefined) {
      if (slug.trim() === '') {
        return NextResponse.json({ 
          error: "Slug cannot be empty",
          code: "INVALID_SLUG" 
        }, { status: 400 });
      }
      updateData.slug = slug.trim();
    }
    if (logo !== undefined) {
      updateData.logo = logo ? logo.trim() : null;
    }
    if (coverImage !== undefined) {
      updateData.coverImage = coverImage ? coverImage.trim() : null;
    }
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }
    if (location !== undefined) {
      updateData.location = location ? location.trim() : null;
    }
    if (website !== undefined) {
      updateData.website = website ? website.trim() : null;
    }
    if (studentCount !== undefined) {
      updateData.studentCount = parseInt(studentCount);
    }
    if (teacherCount !== undefined) {
      updateData.teacherCount = parseInt(teacherCount);
    }
    if (establishedYear !== undefined) {
      updateData.establishedYear = establishedYear ? parseInt(establishedYear) : null;
    }

    const updated = await db.update(schools)
      .set(updateData)
      .where(eq(schools.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    
    // Handle unique constraint violation
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ 
        error: "A school with this slug already exists",
        code: "DUPLICATE_SLUG" 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if school exists
    const existingSchool = await db.select()
      .from(schools)
      .where(eq(schools.id, parseInt(id)))
      .limit(1);

    if (existingSchool.length === 0) {
      return NextResponse.json({ 
        error: 'School not found',
        code: "SCHOOL_NOT_FOUND" 
      }, { status: 404 });
    }

    const deleted = await db.delete(schools)
      .where(eq(schools.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'School deleted successfully',
      school: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}