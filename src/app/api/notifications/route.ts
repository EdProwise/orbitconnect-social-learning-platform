import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, users } from '@/db/schema';
import { eq, and, isNull, desc, or } from 'drizzle-orm';

const VALID_NOTIFICATION_TYPES = ['COMMENT', 'CONNECTION', 'ENROLLMENT', 'REACTION', 'MESSAGE'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single notification by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const notification = await db.select()
        .from(notifications)
        .where(eq(notifications.id, parseInt(id)))
        .limit(1);

      if (notification.length === 0) {
        return NextResponse.json({ 
          error: 'Notification not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(notification[0]);
    }

    // List notifications with filters
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const unread = searchParams.get('unread');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // userId is required for list queries
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ 
        error: 'Valid userId is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    // Build where conditions
    const conditions = [eq(notifications.userId, parseInt(userId))];

    if (type) {
      if (!VALID_NOTIFICATION_TYPES.includes(type)) {
        return NextResponse.json({ 
          error: `Invalid notification type. Valid types: ${VALID_NOTIFICATION_TYPES.join(', ')}`,
          code: 'INVALID_TYPE' 
        }, { status: 400 });
      }
      conditions.push(eq(notifications.type, type));
    }

    if (unread === 'true') {
      conditions.push(isNull(notifications.readAt));
    } else if (unread === 'false') {
      conditions.push(isNull(notifications.readAt));
    }

    const results = await db.select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
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
    const searchParams = request.nextUrl.searchParams;
    const markAllRead = searchParams.get('markAllRead');
    const userId = searchParams.get('userId');

    // Handle mark all as read feature
    if (markAllRead === 'true' && userId) {
      if (!userId || isNaN(parseInt(userId))) {
        return NextResponse.json({ 
          error: 'Valid userId is required',
          code: 'INVALID_USER_ID' 
        }, { status: 400 });
      }

      const updated = await db.update(notifications)
        .set({
          readAt: new Date().toISOString()
        })
        .where(and(
          eq(notifications.userId, parseInt(userId)),
          isNull(notifications.readAt)
        ))
        .returning();

      return NextResponse.json({
        message: 'All notifications marked as read',
        count: updated.length
      });
    }

    // Create new notification
    const body = await request.json();
    const { userId: reqUserId, type, title, message, link } = body;

    // Validate required fields
    if (!reqUserId) {
      return NextResponse.json({ 
        error: 'userId is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ 
        error: 'type is required',
        code: 'MISSING_TYPE' 
      }, { status: 400 });
    }

    if (!title || title.trim() === '') {
      return NextResponse.json({ 
        error: 'title is required and must not be empty',
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    if (!message || message.trim() === '') {
      return NextResponse.json({ 
        error: 'message is required and must not be empty',
        code: 'MISSING_MESSAGE' 
      }, { status: 400 });
    }

    // Validate notification type
    if (!VALID_NOTIFICATION_TYPES.includes(type)) {
      return NextResponse.json({ 
        error: `Invalid notification type. Valid types: ${VALID_NOTIFICATION_TYPES.join(', ')}`,
        code: 'INVALID_TYPE' 
      }, { status: 400 });
    }

    // Validate userId exists
    if (isNaN(parseInt(reqUserId))) {
      return NextResponse.json({ 
        error: 'userId must be a valid integer',
        code: 'INVALID_USER_ID' 
      }, { status: 400 });
    }

    const userExists = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(reqUserId)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 400 });
    }

    // Create notification
    const newNotification = await db.insert(notifications)
      .values({
        userId: parseInt(reqUserId),
        type: type.trim(),
        title: title.trim(),
        message: message.trim(),
        link: link ? link.trim() : null,
        readAt: null,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newNotification[0], { status: 201 });

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
    const markAllRead = searchParams.get('markAllRead');
    const userId = searchParams.get('userId');

    // Handle mark all as read feature
    if (markAllRead === 'true' && userId) {
      if (!userId || isNaN(parseInt(userId))) {
        return NextResponse.json({ 
          error: 'Valid userId is required',
          code: 'INVALID_USER_ID' 
        }, { status: 400 });
      }

      const updated = await db.update(notifications)
        .set({
          readAt: new Date().toISOString()
        })
        .where(and(
          eq(notifications.userId, parseInt(userId)),
          isNull(notifications.readAt)
        ))
        .returning();

      return NextResponse.json({
        message: 'All notifications marked as read',
        count: updated.length
      });
    }

    // Update single notification
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if notification exists
    const existing = await db.select()
      .from(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Notification not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { readAt } = body;

    // Update notification
    const updateData: { readAt?: string | null } = {};
    
    if (readAt !== undefined) {
      updateData.readAt = readAt === null ? null : (readAt || new Date().toISOString());
    }

    const updated = await db.update(notifications)
      .set(updateData)
      .where(eq(notifications.id, parseInt(id)))
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if notification exists
    const existing = await db.select()
      .from(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Notification not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Notification deleted successfully',
      notification: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}