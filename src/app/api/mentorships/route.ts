import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mentorships, users } from '@/db/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single mentorship by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const mentorship = await db.select()
        .from(mentorships)
        .where(eq(mentorships.id, parseInt(id)))
        .limit(1);

      if (mentorship.length === 0) {
        return NextResponse.json({ 
          error: 'Mentorship not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      // Parse JSON fields for response
      const parsedMentorship = {
        ...mentorship[0],
        expertise: typeof mentorship[0].expertise === 'string' 
          ? JSON.parse(mentorship[0].expertise) 
          : mentorship[0].expertise,
        availability: mentorship[0].availability 
          ? (typeof mentorship[0].availability === 'string' 
            ? JSON.parse(mentorship[0].availability) 
            : mentorship[0].availability)
          : null
      };

      return NextResponse.json(parsedMentorship, { status: 200 });
    }

    // List mentorships with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const mentorId = searchParams.get('mentorId');
    const expertise = searchParams.get('expertise');
    const minRating = searchParams.get('minRating');

    let query = db.select().from(mentorships);

    // Build WHERE conditions
    const conditions = [];

    if (mentorId) {
      const mentorIdNum = parseInt(mentorId);
      if (isNaN(mentorIdNum)) {
        return NextResponse.json({ 
          error: "Invalid mentorId parameter",
          code: "INVALID_MENTOR_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(mentorships.mentorId, mentorIdNum));
    }

    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      if (isNaN(minRatingNum)) {
        return NextResponse.json({ 
          error: "Invalid minRating parameter",
          code: "INVALID_MIN_RATING" 
        }, { status: 400 });
      }
      conditions.push(gte(mentorships.rating, minRatingNum));
    }

    // Apply WHERE conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Execute query with sorting
    const results = await query
      .orderBy(desc(mentorships.rating))
      .limit(limit)
      .offset(offset);

    // Parse JSON fields and filter by expertise if needed
    let parsedResults = results.map(mentorship => ({
      ...mentorship,
      expertise: typeof mentorship.expertise === 'string' 
        ? JSON.parse(mentorship.expertise) 
        : mentorship.expertise,
      availability: mentorship.availability 
        ? (typeof mentorship.availability === 'string' 
          ? JSON.parse(mentorship.availability) 
          : mentorship.availability)
        : null
    }));

    // Filter by expertise (check if array contains the value)
    if (expertise) {
      parsedResults = parsedResults.filter(mentorship => {
        const expertiseArray = Array.isArray(mentorship.expertise) 
          ? mentorship.expertise 
          : [];
        return expertiseArray.some(exp => 
          exp.toLowerCase().includes(expertise.toLowerCase())
        );
      });
    }

    return NextResponse.json(parsedResults, { status: 200 });

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
    const { mentorId, expertise, hourlyRate, availability, bio } = body;

    // Validate required fields
    if (!mentorId) {
      return NextResponse.json({ 
        error: "mentorId is required",
        code: "MISSING_MENTOR_ID" 
      }, { status: 400 });
    }

    if (!expertise) {
      return NextResponse.json({ 
        error: "expertise is required",
        code: "MISSING_EXPERTISE" 
      }, { status: 400 });
    }

    if (hourlyRate === undefined || hourlyRate === null) {
      return NextResponse.json({ 
        error: "hourlyRate is required",
        code: "MISSING_HOURLY_RATE" 
      }, { status: 400 });
    }

    // Validate mentorId is a number
    const mentorIdNum = parseInt(mentorId);
    if (isNaN(mentorIdNum)) {
      return NextResponse.json({ 
        error: "mentorId must be a valid number",
        code: "INVALID_MENTOR_ID" 
      }, { status: 400 });
    }

    // Validate hourlyRate is positive
    const hourlyRateNum = parseFloat(hourlyRate);
    if (isNaN(hourlyRateNum) || hourlyRateNum <= 0) {
      return NextResponse.json({ 
        error: "hourlyRate must be a positive number",
        code: "INVALID_HOURLY_RATE" 
      }, { status: 400 });
    }

    // Validate expertise is an array
    if (!Array.isArray(expertise)) {
      return NextResponse.json({ 
        error: "expertise must be an array",
        code: "INVALID_EXPERTISE_FORMAT" 
      }, { status: 400 });
    }

    // Validate availability format if provided
    if (availability !== undefined && availability !== null) {
      if (typeof availability !== 'object' || Array.isArray(availability)) {
        return NextResponse.json({ 
          error: "availability must be a valid object",
          code: "INVALID_AVAILABILITY_FORMAT" 
        }, { status: 400 });
      }
    }

    // Check if mentor exists
    const mentor = await db.select()
      .from(users)
      .where(eq(users.id, mentorIdNum))
      .limit(1);

    if (mentor.length === 0) {
      return NextResponse.json({ 
        error: "Mentor not found",
        code: "MENTOR_NOT_FOUND" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      mentorId: mentorIdNum,
      expertise: JSON.stringify(expertise),
      hourlyRate: hourlyRateNum,
      rating: 0,
      totalSessions: 0,
      availability: availability ? JSON.stringify(availability) : null,
      bio: bio?.trim() || null
    };

    // Insert mentorship
    const newMentorship = await db.insert(mentorships)
      .values(insertData)
      .returning();

    // Parse JSON fields for response
    const parsedMentorship = {
      ...newMentorship[0],
      expertise: JSON.parse(newMentorship[0].expertise as string),
      availability: newMentorship[0].availability 
        ? JSON.parse(newMentorship[0].availability as string) 
        : null
    };

    return NextResponse.json(parsedMentorship, { status: 201 });

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

    const mentorshipId = parseInt(id);

    // Check if mentorship exists
    const existing = await db.select()
      .from(mentorships)
      .where(eq(mentorships.id, mentorshipId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Mentorship not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { mentorId, expertise, hourlyRate, availability, bio, rating, totalSessions } = body;

    // Prepare update data
    const updates: any = {};

    // Validate and add mentorId if provided
    if (mentorId !== undefined) {
      const mentorIdNum = parseInt(mentorId);
      if (isNaN(mentorIdNum)) {
        return NextResponse.json({ 
          error: "mentorId must be a valid number",
          code: "INVALID_MENTOR_ID" 
        }, { status: 400 });
      }

      // Check if mentor exists
      const mentor = await db.select()
        .from(users)
        .where(eq(users.id, mentorIdNum))
        .limit(1);

      if (mentor.length === 0) {
        return NextResponse.json({ 
          error: "Mentor not found",
          code: "MENTOR_NOT_FOUND" 
        }, { status: 400 });
      }

      updates.mentorId = mentorIdNum;
    }

    // Validate and add expertise if provided
    if (expertise !== undefined) {
      if (!Array.isArray(expertise)) {
        return NextResponse.json({ 
          error: "expertise must be an array",
          code: "INVALID_EXPERTISE_FORMAT" 
        }, { status: 400 });
      }
      updates.expertise = JSON.stringify(expertise);
    }

    // Validate and add hourlyRate if provided
    if (hourlyRate !== undefined) {
      const hourlyRateNum = parseFloat(hourlyRate);
      if (isNaN(hourlyRateNum) || hourlyRateNum <= 0) {
        return NextResponse.json({ 
          error: "hourlyRate must be a positive number",
          code: "INVALID_HOURLY_RATE" 
        }, { status: 400 });
      }
      updates.hourlyRate = hourlyRateNum;
    }

    // Validate and add availability if provided
    if (availability !== undefined) {
      if (availability === null) {
        updates.availability = null;
      } else {
        if (typeof availability !== 'object' || Array.isArray(availability)) {
          return NextResponse.json({ 
            error: "availability must be a valid object",
            code: "INVALID_AVAILABILITY_FORMAT" 
          }, { status: 400 });
        }
        updates.availability = JSON.stringify(availability);
      }
    }

    // Validate and add rating if provided
    if (rating !== undefined) {
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        return NextResponse.json({ 
          error: "rating must be between 0 and 5",
          code: "INVALID_RATING" 
        }, { status: 400 });
      }
      updates.rating = ratingNum;
    }

    // Validate and add totalSessions if provided
    if (totalSessions !== undefined) {
      const totalSessionsNum = parseInt(totalSessions);
      if (isNaN(totalSessionsNum) || totalSessionsNum < 0) {
        return NextResponse.json({ 
          error: "totalSessions must be a non-negative number",
          code: "INVALID_TOTAL_SESSIONS" 
        }, { status: 400 });
      }
      updates.totalSessions = totalSessionsNum;
    }

    // Add bio if provided
    if (bio !== undefined) {
      updates.bio = bio ? bio.trim() : null;
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATES" 
      }, { status: 400 });
    }

    // Update mentorship
    const updated = await db.update(mentorships)
      .set(updates)
      .where(eq(mentorships.id, mentorshipId))
      .returning();

    // Parse JSON fields for response
    const parsedMentorship = {
      ...updated[0],
      expertise: typeof updated[0].expertise === 'string' 
        ? JSON.parse(updated[0].expertise) 
        : updated[0].expertise,
      availability: updated[0].availability 
        ? (typeof updated[0].availability === 'string' 
          ? JSON.parse(updated[0].availability) 
          : updated[0].availability)
        : null
    };

    return NextResponse.json(parsedMentorship, { status: 200 });

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

    const mentorshipId = parseInt(id);

    // Check if mentorship exists
    const existing = await db.select()
      .from(mentorships)
      .where(eq(mentorships.id, mentorshipId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Mentorship not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete mentorship
    const deleted = await db.delete(mentorships)
      .where(eq(mentorships.id, mentorshipId))
      .returning();

    // Parse JSON fields for response
    const parsedMentorship = {
      ...deleted[0],
      expertise: typeof deleted[0].expertise === 'string' 
        ? JSON.parse(deleted[0].expertise) 
        : deleted[0].expertise,
      availability: deleted[0].availability 
        ? (typeof deleted[0].availability === 'string' 
          ? JSON.parse(deleted[0].availability) 
          : deleted[0].availability)
        : null
    };

    return NextResponse.json({ 
      message: "Mentorship deleted successfully",
      mentorship: parsedMentorship
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}