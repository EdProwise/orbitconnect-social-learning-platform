import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webinars, users } from '@/db/schema';
import { eq, and, gte, lt, asc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single webinar by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const webinar = await db.select()
        .from(webinars)
        .where(eq(webinars.id, parseInt(id)))
        .limit(1);

      if (webinar.length === 0) {
        return NextResponse.json({ 
          error: 'Webinar not found',
          code: 'WEBINAR_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(webinar[0], { status: 200 });
    }

    // List webinars with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const hostId = searchParams.get('hostId');
    const status = searchParams.get('status');

    let query = db.select().from(webinars);
    const conditions = [];

    // Filter by hostId
    if (hostId) {
      if (isNaN(parseInt(hostId))) {
        return NextResponse.json({ 
          error: 'Valid hostId is required',
          code: 'INVALID_HOST_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(webinars.hostId, parseInt(hostId)));
    }

    // Filter by status (upcoming, live, completed)
    if (status) {
      const now = new Date().toISOString();
      
      if (status === 'upcoming') {
        conditions.push(gte(webinars.scheduledAt, now));
      } else if (status === 'live') {
        // Live: scheduledAt <= now AND scheduledAt + duration > now
        conditions.push(
          and(
            lt(webinars.scheduledAt, now),
            sql`datetime(${webinars.scheduledAt}, '+' || ${webinars.durationMinutes} || ' minutes') > datetime(${now})`
          )
        );
      } else if (status === 'completed') {
        // Completed: scheduledAt + duration <= now
        conditions.push(
          sql`datetime(${webinars.scheduledAt}, '+' || ${webinars.durationMinutes} || ' minutes') <= datetime(${now})`
        );
      } else {
        return NextResponse.json({ 
          error: 'Invalid status. Must be one of: upcoming, live, completed',
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    // Sort by scheduledAt ASC (soonest first) and apply pagination
    const results = await query
      .orderBy(asc(webinars.scheduledAt))
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
      description, 
      hostId, 
      thumbnail, 
      meetingLink, 
      scheduledAt, 
      durationMinutes, 
      maxParticipants 
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ 
        error: 'Title is required',
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    if (!hostId) {
      return NextResponse.json({ 
        error: 'Host ID is required',
        code: 'MISSING_HOST_ID' 
      }, { status: 400 });
    }

    if (!meetingLink) {
      return NextResponse.json({ 
        error: 'Meeting link is required',
        code: 'MISSING_MEETING_LINK' 
      }, { status: 400 });
    }

    if (!scheduledAt) {
      return NextResponse.json({ 
        error: 'Scheduled date/time is required',
        code: 'MISSING_SCHEDULED_AT' 
      }, { status: 400 });
    }

    if (!durationMinutes) {
      return NextResponse.json({ 
        error: 'Duration in minutes is required',
        code: 'MISSING_DURATION' 
      }, { status: 400 });
    }

    if (!maxParticipants) {
      return NextResponse.json({ 
        error: 'Maximum participants is required',
        code: 'MISSING_MAX_PARTICIPANTS' 
      }, { status: 400 });
    }

    // Validate hostId is valid integer
    if (isNaN(parseInt(hostId))) {
      return NextResponse.json({ 
        error: 'Valid host ID is required',
        code: 'INVALID_HOST_ID' 
      }, { status: 400 });
    }

    // Validate durationMinutes is positive
    if (parseInt(durationMinutes) <= 0) {
      return NextResponse.json({ 
        error: 'Duration must be a positive number',
        code: 'INVALID_DURATION' 
      }, { status: 400 });
    }

    // Validate maxParticipants is positive
    if (parseInt(maxParticipants) <= 0) {
      return NextResponse.json({ 
        error: 'Maximum participants must be a positive number',
        code: 'INVALID_MAX_PARTICIPANTS' 
      }, { status: 400 });
    }

    // Validate hostId references existing user
    const hostExists = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(hostId)))
      .limit(1);

    if (hostExists.length === 0) {
      return NextResponse.json({ 
        error: 'Host user does not exist',
        code: 'INVALID_HOST' 
      }, { status: 400 });
    }

    // Validate scheduledAt is valid ISO timestamp
    try {
      new Date(scheduledAt).toISOString();
    } catch {
      return NextResponse.json({ 
        error: 'Invalid scheduled date/time format. Use ISO 8601 format',
        code: 'INVALID_SCHEDULED_AT' 
      }, { status: 400 });
    }

    // Create webinar
    const newWebinar = await db.insert(webinars)
      .values({
        title: title.trim(),
        description: description ? description.trim() : null,
        hostId: parseInt(hostId),
        thumbnail: thumbnail ? thumbnail.trim() : null,
        meetingLink: meetingLink.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: parseInt(durationMinutes),
        maxParticipants: parseInt(maxParticipants),
        registeredCount: 0,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newWebinar[0], { status: 201 });
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
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if webinar exists
    const existingWebinar = await db.select()
      .from(webinars)
      .where(eq(webinars.id, parseInt(id)))
      .limit(1);

    if (existingWebinar.length === 0) {
      return NextResponse.json({ 
        error: 'Webinar not found',
        code: 'WEBINAR_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and prepare updates
    if (body.title !== undefined) {
      if (!body.title) {
        return NextResponse.json({ 
          error: 'Title cannot be empty',
          code: 'INVALID_TITLE' 
        }, { status: 400 });
      }
      updates.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description ? body.description.trim() : null;
    }

    if (body.hostId !== undefined) {
      if (isNaN(parseInt(body.hostId))) {
        return NextResponse.json({ 
          error: 'Valid host ID is required',
          code: 'INVALID_HOST_ID' 
        }, { status: 400 });
      }

      // Validate hostId references existing user
      const hostExists = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(body.hostId)))
        .limit(1);

      if (hostExists.length === 0) {
        return NextResponse.json({ 
          error: 'Host user does not exist',
          code: 'INVALID_HOST' 
        }, { status: 400 });
      }

      updates.hostId = parseInt(body.hostId);
    }

    if (body.thumbnail !== undefined) {
      updates.thumbnail = body.thumbnail ? body.thumbnail.trim() : null;
    }

    if (body.meetingLink !== undefined) {
      if (!body.meetingLink) {
        return NextResponse.json({ 
          error: 'Meeting link cannot be empty',
          code: 'INVALID_MEETING_LINK' 
        }, { status: 400 });
      }
      updates.meetingLink = body.meetingLink.trim();
    }

    if (body.scheduledAt !== undefined) {
      try {
        updates.scheduledAt = new Date(body.scheduledAt).toISOString();
      } catch {
        return NextResponse.json({ 
          error: 'Invalid scheduled date/time format. Use ISO 8601 format',
          code: 'INVALID_SCHEDULED_AT' 
        }, { status: 400 });
      }
    }

    if (body.durationMinutes !== undefined) {
      if (parseInt(body.durationMinutes) <= 0) {
        return NextResponse.json({ 
          error: 'Duration must be a positive number',
          code: 'INVALID_DURATION' 
        }, { status: 400 });
      }
      updates.durationMinutes = parseInt(body.durationMinutes);
    }

    if (body.maxParticipants !== undefined) {
      if (parseInt(body.maxParticipants) <= 0) {
        return NextResponse.json({ 
          error: 'Maximum participants must be a positive number',
          code: 'INVALID_MAX_PARTICIPANTS' 
        }, { status: 400 });
      }
      updates.maxParticipants = parseInt(body.maxParticipants);
    }

    if (body.registeredCount !== undefined) {
      const newRegisteredCount = parseInt(body.registeredCount);
      const maxParticipants = updates.maxParticipants || existingWebinar[0].maxParticipants;

      if (newRegisteredCount < 0) {
        return NextResponse.json({ 
          error: 'Registered count cannot be negative',
          code: 'INVALID_REGISTERED_COUNT' 
        }, { status: 400 });
      }

      if (newRegisteredCount > maxParticipants) {
        return NextResponse.json({ 
          error: 'Registered count cannot exceed maximum participants',
          code: 'MAX_PARTICIPANTS_EXCEEDED' 
        }, { status: 400 });
      }

      updates.registeredCount = newRegisteredCount;
    }

    // Update webinar
    const updatedWebinar = await db.update(webinars)
      .set(updates)
      .where(eq(webinars.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedWebinar[0], { status: 200 });
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
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if webinar exists
    const existingWebinar = await db.select()
      .from(webinars)
      .where(eq(webinars.id, parseInt(id)))
      .limit(1);

    if (existingWebinar.length === 0) {
      return NextResponse.json({ 
        error: 'Webinar not found',
        code: 'WEBINAR_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete webinar
    const deleted = await db.delete(webinars)
      .where(eq(webinars.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Webinar deleted successfully',
      webinar: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}