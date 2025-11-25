import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tutors, users } from '@/db/schema';
import { eq, like, and, or, desc, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single tutor by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const tutor = await db.select()
        .from(tutors)
        .where(eq(tutors.id, parseInt(id)))
        .limit(1);

      if (tutor.length === 0) {
        return NextResponse.json({ 
          error: 'Tutor not found',
          code: 'TUTOR_NOT_FOUND' 
        }, { status: 404 });
      }

      // Parse subjects JSON
      const tutorData = {
        ...tutor[0],
        subjects: typeof tutor[0].subjects === 'string' 
          ? JSON.parse(tutor[0].subjects) 
          : tutor[0].subjects
      };

      return NextResponse.json(tutorData, { status: 200 });
    }

    // List tutors with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const tutorId = searchParams.get('tutorId');
    const subject = searchParams.get('subject');
    const minRating = searchParams.get('minRating');
    const minExperience = searchParams.get('minExperience');

    let query = db.select().from(tutors);

    // Build filter conditions
    const conditions = [];

    if (tutorId) {
      const tutorIdNum = parseInt(tutorId);
      if (!isNaN(tutorIdNum)) {
        conditions.push(eq(tutors.tutorId, tutorIdNum));
      }
    }

    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      if (!isNaN(minRatingNum)) {
        conditions.push(gte(tutors.rating, minRatingNum));
      }
    }

    if (minExperience) {
      const minExpNum = parseInt(minExperience);
      if (!isNaN(minExpNum)) {
        conditions.push(gte(tutors.experienceYears, minExpNum));
      }
    }

    // Apply filters
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Execute query with sorting
    let results = await query
      .orderBy(desc(tutors.rating))
      .limit(limit)
      .offset(offset);

    // Filter by subject (check if JSON array contains the value)
    if (subject) {
      results = results.filter(tutor => {
        const subjectsArray = typeof tutor.subjects === 'string' 
          ? JSON.parse(tutor.subjects) 
          : tutor.subjects;
        return Array.isArray(subjectsArray) && subjectsArray.includes(subject);
      });
    }

    // Parse subjects JSON for all results
    const tutorsData = results.map(tutor => ({
      ...tutor,
      subjects: typeof tutor.subjects === 'string' 
        ? JSON.parse(tutor.subjects) 
        : tutor.subjects
    }));

    return NextResponse.json(tutorsData, { status: 200 });

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
    const { tutorId, subjects, experienceYears, hourlyRate, bio } = body;

    // Validate required fields
    if (!tutorId) {
      return NextResponse.json({ 
        error: "tutorId is required",
        code: "MISSING_TUTOR_ID" 
      }, { status: 400 });
    }

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json({ 
        error: "subjects must be a non-empty array",
        code: "INVALID_SUBJECTS" 
      }, { status: 400 });
    }

    if (experienceYears === undefined || experienceYears === null) {
      return NextResponse.json({ 
        error: "experienceYears is required",
        code: "MISSING_EXPERIENCE_YEARS" 
      }, { status: 400 });
    }

    if (hourlyRate === undefined || hourlyRate === null) {
      return NextResponse.json({ 
        error: "hourlyRate is required",
        code: "MISSING_HOURLY_RATE" 
      }, { status: 400 });
    }

    // Validate field values
    if (experienceYears < 0) {
      return NextResponse.json({ 
        error: "experienceYears must be non-negative",
        code: "INVALID_EXPERIENCE_YEARS" 
      }, { status: 400 });
    }

    if (hourlyRate <= 0) {
      return NextResponse.json({ 
        error: "hourlyRate must be positive",
        code: "INVALID_HOURLY_RATE" 
      }, { status: 400 });
    }

    // Validate tutorId references existing user
    const user = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(tutorId)))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ 
        error: "tutorId must reference an existing user",
        code: "INVALID_TUTOR_ID" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData = {
      tutorId: parseInt(tutorId),
      subjects: JSON.stringify(subjects),
      experienceYears: parseInt(experienceYears),
      hourlyRate: parseFloat(hourlyRate),
      rating: 0,
      totalStudents: 0,
      bio: bio?.trim() || null,
    };

    const newTutor = await db.insert(tutors)
      .values(insertData)
      .returning();

    // Parse subjects JSON in response
    const tutorData = {
      ...newTutor[0],
      subjects: JSON.parse(newTutor[0].subjects as string)
    };

    return NextResponse.json(tutorData, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON' 
      }, { status: 400 });
    }

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

    // Check if tutor exists
    const existingTutor = await db.select()
      .from(tutors)
      .where(eq(tutors.id, parseInt(id)))
      .limit(1);

    if (existingTutor.length === 0) {
      return NextResponse.json({ 
        error: 'Tutor not found',
        code: 'TUTOR_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    // Handle subjects field
    if (body.subjects !== undefined) {
      if (!Array.isArray(body.subjects)) {
        return NextResponse.json({ 
          error: "subjects must be an array",
          code: "INVALID_SUBJECTS" 
        }, { status: 400 });
      }
      updates.subjects = JSON.stringify(body.subjects);
    }

    // Handle experienceYears
    if (body.experienceYears !== undefined) {
      const expYears = parseInt(body.experienceYears);
      if (isNaN(expYears) || expYears < 0) {
        return NextResponse.json({ 
          error: "experienceYears must be a non-negative integer",
          code: "INVALID_EXPERIENCE_YEARS" 
        }, { status: 400 });
      }
      updates.experienceYears = expYears;
    }

    // Handle hourlyRate
    if (body.hourlyRate !== undefined) {
      const rate = parseFloat(body.hourlyRate);
      if (isNaN(rate) || rate <= 0) {
        return NextResponse.json({ 
          error: "hourlyRate must be a positive number",
          code: "INVALID_HOURLY_RATE" 
        }, { status: 400 });
      }
      updates.hourlyRate = rate;
    }

    // Handle rating
    if (body.rating !== undefined) {
      const rating = parseFloat(body.rating);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        return NextResponse.json({ 
          error: "rating must be between 0 and 5",
          code: "INVALID_RATING" 
        }, { status: 400 });
      }
      updates.rating = rating;
    }

    // Handle totalStudents
    if (body.totalStudents !== undefined) {
      const total = parseInt(body.totalStudents);
      if (isNaN(total) || total < 0) {
        return NextResponse.json({ 
          error: "totalStudents must be a non-negative integer",
          code: "INVALID_TOTAL_STUDENTS" 
        }, { status: 400 });
      }
      updates.totalStudents = total;
    }

    // Handle bio
    if (body.bio !== undefined) {
      updates.bio = body.bio ? body.bio.trim() : null;
    }

    // Handle tutorId
    if (body.tutorId !== undefined) {
      const tutorIdNum = parseInt(body.tutorId);
      if (isNaN(tutorIdNum)) {
        return NextResponse.json({ 
          error: "tutorId must be a valid integer",
          code: "INVALID_TUTOR_ID" 
        }, { status: 400 });
      }

      // Validate tutorId references existing user
      const user = await db.select()
        .from(users)
        .where(eq(users.id, tutorIdNum))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json({ 
          error: "tutorId must reference an existing user",
          code: "INVALID_TUTOR_ID" 
        }, { status: 400 });
      }

      updates.tutorId = tutorIdNum;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATES" 
      }, { status: 400 });
    }

    const updated = await db.update(tutors)
      .set(updates)
      .where(eq(tutors.id, parseInt(id)))
      .returning();

    // Parse subjects JSON in response
    const tutorData = {
      ...updated[0],
      subjects: typeof updated[0].subjects === 'string'
        ? JSON.parse(updated[0].subjects)
        : updated[0].subjects
    };

    return NextResponse.json(tutorData, { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON' 
      }, { status: 400 });
    }

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

    // Check if tutor exists before deleting
    const existingTutor = await db.select()
      .from(tutors)
      .where(eq(tutors.id, parseInt(id)))
      .limit(1);

    if (existingTutor.length === 0) {
      return NextResponse.json({ 
        error: 'Tutor not found',
        code: 'TUTOR_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(tutors)
      .where(eq(tutors.id, parseInt(id)))
      .returning();

    // Parse subjects JSON in response
    const tutorData = {
      ...deleted[0],
      subjects: typeof deleted[0].subjects === 'string'
        ? JSON.parse(deleted[0].subjects)
        : deleted[0].subjects
    };

    return NextResponse.json({
      message: 'Tutor deleted successfully',
      tutor: tutorData
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}