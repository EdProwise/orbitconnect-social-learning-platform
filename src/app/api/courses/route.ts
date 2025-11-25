import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, users } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

const VALID_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single course by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const course = await db.select()
        .from(courses)
        .where(eq(courses.id, parseInt(id)))
        .limit(1);

      if (course.length === 0) {
        return NextResponse.json({ 
          error: 'Course not found',
          code: 'COURSE_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(course[0], { status: 200 });
    }

    // List courses with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const instructorId = searchParams.get('instructorId');
    const schoolId = searchParams.get('schoolId');

    let query = db.select().from(courses);

    const conditions = [];

    // Search by title or description
    if (search) {
      conditions.push(
        or(
          like(courses.title, `%${search}%`),
          like(courses.description, `%${search}%`)
        )
      );
    }

    // Filter by category
    if (category) {
      conditions.push(eq(courses.category, category));
    }

    // Filter by level
    if (level) {
      conditions.push(eq(courses.level, level));
    }

    // Filter by instructorId
    if (instructorId) {
      if (!isNaN(parseInt(instructorId))) {
        conditions.push(eq(courses.instructorId, parseInt(instructorId)));
      }
    }

    // Filter by schoolId
    if (schoolId) {
      if (!isNaN(parseInt(schoolId))) {
        conditions.push(eq(courses.schoolId, parseInt(schoolId)));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(courses.createdAt))
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
    const { 
      title, 
      slug, 
      description, 
      instructorId, 
      schoolId, 
      category, 
      thumbnail, 
      durationHours, 
      level, 
      price 
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ 
        error: "Slug is required",
        code: "MISSING_SLUG" 
      }, { status: 400 });
    }

    if (!instructorId) {
      return NextResponse.json({ 
        error: "Instructor ID is required",
        code: "MISSING_INSTRUCTOR_ID" 
      }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ 
        error: "Category is required",
        code: "MISSING_CATEGORY" 
      }, { status: 400 });
    }

    if (!level) {
      return NextResponse.json({ 
        error: "Level is required",
        code: "MISSING_LEVEL" 
      }, { status: 400 });
    }

    if (price === undefined || price === null) {
      return NextResponse.json({ 
        error: "Price is required",
        code: "MISSING_PRICE" 
      }, { status: 400 });
    }

    // Validate level
    if (!VALID_LEVELS.includes(level)) {
      return NextResponse.json({ 
        error: `Level must be one of: ${VALID_LEVELS.join(', ')}`,
        code: "INVALID_LEVEL" 
      }, { status: 400 });
    }

    // Validate price
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json({ 
        error: "Price must be a positive number",
        code: "INVALID_PRICE" 
      }, { status: 400 });
    }

    // Check if slug is unique
    const existingCourse = await db.select()
      .from(courses)
      .where(eq(courses.slug, slug))
      .limit(1);

    if (existingCourse.length > 0) {
      return NextResponse.json({ 
        error: "Slug must be unique",
        code: "DUPLICATE_SLUG" 
      }, { status: 400 });
    }

    // Validate instructorId exists
    const instructor = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(instructorId)))
      .limit(1);

    if (instructor.length === 0) {
      return NextResponse.json({ 
        error: "Instructor does not exist",
        code: "INVALID_INSTRUCTOR_ID" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData = {
      title: title.trim(),
      slug: slug.trim(),
      description: description ? description.trim() : null,
      instructorId: parseInt(instructorId),
      schoolId: schoolId ? parseInt(schoolId) : null,
      category: category.trim(),
      thumbnail: thumbnail ? thumbnail.trim() : null,
      durationHours: durationHours ? parseInt(durationHours) : null,
      level,
      price: parseFloat(price),
      enrolledCount: 0,
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newCourse = await db.insert(courses)
      .values(insertData)
      .returning();

    return NextResponse.json(newCourse[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if course exists
    const existingCourse = await db.select()
      .from(courses)
      .where(eq(courses.id, parseInt(id)))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json({ 
        error: 'Course not found',
        code: 'COURSE_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      title, 
      slug, 
      description, 
      instructorId, 
      schoolId, 
      category, 
      thumbnail, 
      durationHours, 
      level, 
      price,
      enrolledCount,
      rating
    } = body;

    // Validate level if provided
    if (level && !VALID_LEVELS.includes(level)) {
      return NextResponse.json({ 
        error: `Level must be one of: ${VALID_LEVELS.join(', ')}`,
        code: "INVALID_LEVEL" 
      }, { status: 400 });
    }

    // Validate price if provided
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return NextResponse.json({ 
        error: "Price must be a positive number",
        code: "INVALID_PRICE" 
      }, { status: 400 });
    }

    // Check if slug is unique (if being updated)
    if (slug && slug !== existingCourse[0].slug) {
      const slugCheck = await db.select()
        .from(courses)
        .where(eq(courses.slug, slug))
        .limit(1);

      if (slugCheck.length > 0) {
        return NextResponse.json({ 
          error: "Slug must be unique",
          code: "DUPLICATE_SLUG" 
        }, { status: 400 });
      }
    }

    // Validate instructorId if provided
    if (instructorId) {
      const instructor = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(instructorId)))
        .limit(1);

      if (instructor.length === 0) {
        return NextResponse.json({ 
          error: "Instructor does not exist",
          code: "INVALID_INSTRUCTOR_ID" 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (slug !== undefined) updateData.slug = slug.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (instructorId !== undefined) updateData.instructorId = parseInt(instructorId);
    if (schoolId !== undefined) updateData.schoolId = schoolId ? parseInt(schoolId) : null;
    if (category !== undefined) updateData.category = category.trim();
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail ? thumbnail.trim() : null;
    if (durationHours !== undefined) updateData.durationHours = durationHours ? parseInt(durationHours) : null;
    if (level !== undefined) updateData.level = level;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (enrolledCount !== undefined) updateData.enrolledCount = parseInt(enrolledCount);
    if (rating !== undefined) updateData.rating = parseFloat(rating);

    const updated = await db.update(courses)
      .set(updateData)
      .where(eq(courses.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if course exists
    const existingCourse = await db.select()
      .from(courses)
      .where(eq(courses.id, parseInt(id)))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json({ 
        error: 'Course not found',
        code: 'COURSE_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(courses)
      .where(eq(courses.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Course deleted successfully',
      course: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}