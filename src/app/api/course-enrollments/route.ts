import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courseEnrollments, courses } from '@/db/schema';
import { eq, and, isNull, isNotNull, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single enrollment by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const enrollment = await db.select()
        .from(courseEnrollments)
        .where(eq(courseEnrollments.id, parseInt(id)))
        .limit(1);

      if (enrollment.length === 0) {
        return NextResponse.json({ 
          error: 'Enrollment not found',
          code: 'ENROLLMENT_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(enrollment[0]);
    }

    // List enrollments with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');
    const completed = searchParams.get('completed');

    let query = db.select().from(courseEnrollments);

    // Build filter conditions
    const conditions = [];

    if (courseId) {
      if (isNaN(parseInt(courseId))) {
        return NextResponse.json({ 
          error: "Valid courseId is required",
          code: "INVALID_COURSE_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(courseEnrollments.courseId, parseInt(courseId)));
    }

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json({ 
          error: "Valid userId is required",
          code: "INVALID_USER_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(courseEnrollments.userId, parseInt(userId)));
    }

    if (completed === 'true') {
      conditions.push(isNotNull(courseEnrollments.completedAt));
    } else if (completed === 'false') {
      conditions.push(isNull(courseEnrollments.completedAt));
    }

    // Apply filters if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sort by enrolledAt DESC (newest first)
    const results = await query
      .orderBy(desc(courseEnrollments.enrolledAt))
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
    const { courseId, userId } = body;

    // Validate required fields
    if (!courseId) {
      return NextResponse.json({ 
        error: "courseId is required",
        code: "MISSING_COURSE_ID" 
      }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    // Validate IDs are valid integers
    if (isNaN(parseInt(courseId))) {
      return NextResponse.json({ 
        error: "Valid courseId is required",
        code: "INVALID_COURSE_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(userId))) {
      return NextResponse.json({ 
        error: "Valid userId is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    // Validate course exists
    const courseExists = await db.select()
      .from(courses)
      .where(eq(courses.id, parseInt(courseId)))
      .limit(1);

    if (courseExists.length === 0) {
      return NextResponse.json({ 
        error: "Course does not exist",
        code: "COURSE_NOT_FOUND" 
      }, { status: 400 });
    }

    // Check for duplicate enrollment
    const existingEnrollment = await db.select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.courseId, parseInt(courseId)),
          eq(courseEnrollments.userId, parseInt(userId))
        )
      )
      .limit(1);

    if (existingEnrollment.length > 0) {
      return NextResponse.json({ 
        error: "User is already enrolled in this course",
        code: "DUPLICATE_ENROLLMENT" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create enrollment
    const newEnrollment = await db.insert(courseEnrollments)
      .values({
        courseId: parseInt(courseId),
        userId: parseInt(userId),
        progressPercent: 0,
        completedAt: null,
        enrolledAt: now,
        lastAccessed: now,
      })
      .returning();

    // Increment enrolledCount in courses table
    await db.update(courses)
      .set({
        enrolledCount: sql`${courses.enrolledCount} + 1`,
        updatedAt: now
      })
      .where(eq(courses.id, parseInt(courseId)));

    return NextResponse.json(newEnrollment[0], { status: 201 });
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

    const body = await request.json();
    const { progressPercent } = body;

    // Check if enrollment exists
    const existingEnrollment = await db.select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.id, parseInt(id)))
      .limit(1);

    if (existingEnrollment.length === 0) {
      return NextResponse.json({ 
        error: 'Enrollment not found',
        code: 'ENROLLMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updateData: any = {
      lastAccessed: now
    };

    // Validate and update progressPercent if provided
    if (progressPercent !== undefined) {
      const progress = parseInt(progressPercent);
      
      if (isNaN(progress) || progress < 0 || progress > 100) {
        return NextResponse.json({ 
          error: "progressPercent must be between 0 and 100",
          code: "INVALID_PROGRESS_PERCENT" 
        }, { status: 400 });
      }

      updateData.progressPercent = progress;

      // If progress reaches 100 and not already completed, set completedAt
      if (progress === 100 && !existingEnrollment[0].completedAt) {
        updateData.completedAt = now;
      }
    }

    // Update enrollment
    const updated = await db.update(courseEnrollments)
      .set(updateData)
      .where(eq(courseEnrollments.id, parseInt(id)))
      .returning();

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

    // Check if enrollment exists and get courseId
    const existingEnrollment = await db.select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.id, parseInt(id)))
      .limit(1);

    if (existingEnrollment.length === 0) {
      return NextResponse.json({ 
        error: 'Enrollment not found',
        code: 'ENROLLMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    const courseId = existingEnrollment[0].courseId;

    // Delete enrollment
    const deleted = await db.delete(courseEnrollments)
      .where(eq(courseEnrollments.id, parseInt(id)))
      .returning();

    // Decrement enrolledCount in courses table
    await db.update(courses)
      .set({
        enrolledCount: sql`${courses.enrolledCount} - 1`,
        updatedAt: new Date().toISOString()
      })
      .where(eq(courses.id, courseId));

    return NextResponse.json({
      message: 'Enrollment deleted successfully',
      enrollment: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}