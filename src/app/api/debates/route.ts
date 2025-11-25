import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { debates, users } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

const VALID_STATUSES = ['UPCOMING', 'LIVE', 'COMPLETED'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single debate by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const debate = await db.select()
        .from(debates)
        .where(eq(debates.id, parseInt(id)))
        .limit(1);

      if (debate.length === 0) {
        return NextResponse.json({ 
          error: 'Debate not found',
          code: "DEBATE_NOT_FOUND" 
        }, { status: 404 });
      }

      // Parse JSON fields
      const debateRecord = debate[0];
      return NextResponse.json({
        ...debateRecord,
        teamAMembers: debateRecord.teamAMembers ? JSON.parse(debateRecord.teamAMembers as string) : null,
        teamBMembers: debateRecord.teamBMembers ? JSON.parse(debateRecord.teamBMembers as string) : null,
      });
    }

    // List debates with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const organizerId = searchParams.get('organizerId');
    const status = searchParams.get('status');

    let query = db.select().from(debates);

    // Build filters
    const filters = [];
    if (organizerId) {
      const organizerIdNum = parseInt(organizerId);
      if (isNaN(organizerIdNum)) {
        return NextResponse.json({ 
          error: "Invalid organizerId",
          code: "INVALID_ORGANIZER_ID" 
        }, { status: 400 });
      }
      filters.push(eq(debates.organizerId, organizerIdNum));
    }

    if (status) {
      if (!VALID_STATUSES.includes(status as any)) {
        return NextResponse.json({ 
          error: "Invalid status. Must be one of: UPCOMING, LIVE, COMPLETED",
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      filters.push(eq(debates.status, status));
    }

    if (filters.length > 0) {
      query = query.where(and(...filters));
    }

    // Sort by scheduledAt ASC (soonest first)
    const results = await query
      .orderBy(asc(debates.scheduledAt))
      .limit(limit)
      .offset(offset);

    // Parse JSON fields in results
    const parsedResults = results.map(debate => ({
      ...debate,
      teamAMembers: debate.teamAMembers ? JSON.parse(debate.teamAMembers as string) : null,
      teamBMembers: debate.teamBMembers ? JSON.parse(debate.teamBMembers as string) : null,
    }));

    return NextResponse.json(parsedResults);
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      topic, 
      organizerId, 
      format, 
      scheduledAt, 
      durationMinutes, 
      teamAMembers, 
      teamBMembers, 
      status 
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!topic) {
      return NextResponse.json({ 
        error: "Topic is required",
        code: "MISSING_TOPIC" 
      }, { status: 400 });
    }

    if (!organizerId) {
      return NextResponse.json({ 
        error: "Organizer ID is required",
        code: "MISSING_ORGANIZER_ID" 
      }, { status: 400 });
    }

    if (!format) {
      return NextResponse.json({ 
        error: "Format is required",
        code: "MISSING_FORMAT" 
      }, { status: 400 });
    }

    if (!scheduledAt) {
      return NextResponse.json({ 
        error: "Scheduled date/time is required",
        code: "MISSING_SCHEDULED_AT" 
      }, { status: 400 });
    }

    if (!durationMinutes) {
      return NextResponse.json({ 
        error: "Duration in minutes is required",
        code: "MISSING_DURATION" 
      }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ 
        error: "Status is required",
        code: "MISSING_STATUS" 
      }, { status: 400 });
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be one of: UPCOMING, LIVE, COMPLETED",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Validate durationMinutes is positive
    if (durationMinutes <= 0) {
      return NextResponse.json({ 
        error: "Duration must be a positive number",
        code: "INVALID_DURATION" 
      }, { status: 400 });
    }

    // Validate organizerId exists
    const organizer = await db.select()
      .from(users)
      .where(eq(users.id, organizerId))
      .limit(1);

    if (organizer.length === 0) {
      return NextResponse.json({ 
        error: "Organizer user not found",
        code: "ORGANIZER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      title: title.trim(),
      topic: topic.trim(),
      organizerId,
      format: format.trim(),
      scheduledAt,
      durationMinutes,
      status,
      createdAt: new Date().toISOString(),
    };

    // Handle JSON fields
    if (teamAMembers) {
      if (!Array.isArray(teamAMembers)) {
        return NextResponse.json({ 
          error: "teamAMembers must be an array",
          code: "INVALID_TEAM_A_MEMBERS" 
        }, { status: 400 });
      }
      insertData.teamAMembers = JSON.stringify(teamAMembers);
    }

    if (teamBMembers) {
      if (!Array.isArray(teamBMembers)) {
        return NextResponse.json({ 
          error: "teamBMembers must be an array",
          code: "INVALID_TEAM_B_MEMBERS" 
        }, { status: 400 });
      }
      insertData.teamBMembers = JSON.stringify(teamBMembers);
    }

    const newDebate = await db.insert(debates)
      .values(insertData)
      .returning();

    // Parse JSON fields in response
    const debateRecord = newDebate[0];
    return NextResponse.json({
      ...debateRecord,
      teamAMembers: debateRecord.teamAMembers ? JSON.parse(debateRecord.teamAMembers as string) : null,
      teamBMembers: debateRecord.teamBMembers ? JSON.parse(debateRecord.teamBMembers as string) : null,
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
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

    // Check if debate exists
    const existingDebate = await db.select()
      .from(debates)
      .where(eq(debates.id, parseInt(id)))
      .limit(1);

    if (existingDebate.length === 0) {
      return NextResponse.json({ 
        error: 'Debate not found',
        code: "DEBATE_NOT_FOUND" 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (body.title !== undefined) {
      updateData.title = body.title.trim();
    }

    if (body.topic !== undefined) {
      updateData.topic = body.topic.trim();
    }

    if (body.organizerId !== undefined) {
      // Validate organizerId exists
      const organizer = await db.select()
        .from(users)
        .where(eq(users.id, body.organizerId))
        .limit(1);

      if (organizer.length === 0) {
        return NextResponse.json({ 
          error: "Organizer user not found",
          code: "ORGANIZER_NOT_FOUND" 
        }, { status: 400 });
      }
      updateData.organizerId = body.organizerId;
    }

    if (body.format !== undefined) {
      updateData.format = body.format.trim();
    }

    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = body.scheduledAt;
    }

    if (body.durationMinutes !== undefined) {
      if (body.durationMinutes <= 0) {
        return NextResponse.json({ 
          error: "Duration must be a positive number",
          code: "INVALID_DURATION" 
        }, { status: 400 });
      }
      updateData.durationMinutes = body.durationMinutes;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ 
          error: "Invalid status. Must be one of: UPCOMING, LIVE, COMPLETED",
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      updateData.status = body.status;
    }

    // Handle JSON fields
    if (body.teamAMembers !== undefined) {
      if (body.teamAMembers === null) {
        updateData.teamAMembers = null;
      } else {
        if (!Array.isArray(body.teamAMembers)) {
          return NextResponse.json({ 
            error: "teamAMembers must be an array",
            code: "INVALID_TEAM_A_MEMBERS" 
          }, { status: 400 });
        }
        updateData.teamAMembers = JSON.stringify(body.teamAMembers);
      }
    }

    if (body.teamBMembers !== undefined) {
      if (body.teamBMembers === null) {
        updateData.teamBMembers = null;
      } else {
        if (!Array.isArray(body.teamBMembers)) {
          return NextResponse.json({ 
            error: "teamBMembers must be an array",
            code: "INVALID_TEAM_B_MEMBERS" 
          }, { status: 400 });
        }
        updateData.teamBMembers = JSON.stringify(body.teamBMembers);
      }
    }

    const updated = await db.update(debates)
      .set(updateData)
      .where(eq(debates.id, parseInt(id)))
      .returning();

    // Parse JSON fields in response
    const debateRecord = updated[0];
    return NextResponse.json({
      ...debateRecord,
      teamAMembers: debateRecord.teamAMembers ? JSON.parse(debateRecord.teamAMembers as string) : null,
      teamBMembers: debateRecord.teamBMembers ? JSON.parse(debateRecord.teamBMembers as string) : null,
    });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
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

    // Check if debate exists
    const existingDebate = await db.select()
      .from(debates)
      .where(eq(debates.id, parseInt(id)))
      .limit(1);

    if (existingDebate.length === 0) {
      return NextResponse.json({ 
        error: 'Debate not found',
        code: "DEBATE_NOT_FOUND" 
      }, { status: 404 });
    }

    const deleted = await db.delete(debates)
      .where(eq(debates.id, parseInt(id)))
      .returning();

    // Parse JSON fields in response
    const debateRecord = deleted[0];
    return NextResponse.json({
      message: 'Debate deleted successfully',
      debate: {
        ...debateRecord,
        teamAMembers: debateRecord.teamAMembers ? JSON.parse(debateRecord.teamAMembers as string) : null,
        teamBMembers: debateRecord.teamBMembers ? JSON.parse(debateRecord.teamBMembers as string) : null,
      }
    });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}