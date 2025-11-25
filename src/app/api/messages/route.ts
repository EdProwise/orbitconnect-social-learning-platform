import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, users } from '@/db/schema';
import { eq, and, or, desc, isNull, isNotNull, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single message by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const message = await db.select()
        .from(messages)
        .where(eq(messages.id, parseInt(id)))
        .limit(1);

      if (message.length === 0) {
        return NextResponse.json({ 
          error: 'Message not found',
          code: "MESSAGE_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(message[0], { status: 200 });
    }

    // List messages with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const senderId = searchParams.get('senderId');
    const receiverId = searchParams.get('receiverId');
    const conversationWith = searchParams.get('conversationWith');
    const unread = searchParams.get('unread');

    let query = db.select().from(messages);

    // Build filter conditions
    const conditions: any[] = [];

    // Filter by senderId
    if (senderId && !isNaN(parseInt(senderId))) {
      conditions.push(eq(messages.senderId, parseInt(senderId)));
    }

    // Filter by receiverId
    if (receiverId && !isNaN(parseInt(receiverId))) {
      conditions.push(eq(messages.receiverId, parseInt(receiverId)));
    }

    // Special conversation filter - bidirectional messages between two users
    if (conversationWith && !isNaN(parseInt(conversationWith))) {
      const userId = parseInt(conversationWith);
      // This will need to be combined with the authenticated user ID in production
      // For now, returning messages where either sender or receiver is the specified user
      const conversationCondition = or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      );
      conditions.push(conversationCondition);
    }

    // Filter by unread status
    if (unread === 'true') {
      conditions.push(isNull(messages.readAt));
    } else if (unread === 'false') {
      conditions.push(isNotNull(messages.readAt));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sort by createdAt DESC (newest first) and apply pagination
    const results = await query
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverId, content } = body;

    // Validate required fields
    if (!senderId) {
      return NextResponse.json({ 
        error: "senderId is required",
        code: "MISSING_SENDER_ID" 
      }, { status: 400 });
    }

    if (!receiverId) {
      return NextResponse.json({ 
        error: "receiverId is required",
        code: "MISSING_RECEIVER_ID" 
      }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ 
        error: "content is required",
        code: "MISSING_CONTENT" 
      }, { status: 400 });
    }

    // Validate content is not empty
    if (content.trim().length === 0) {
      return NextResponse.json({ 
        error: "content cannot be empty",
        code: "EMPTY_CONTENT" 
      }, { status: 400 });
    }

    // Validate IDs are numbers
    if (isNaN(parseInt(senderId))) {
      return NextResponse.json({ 
        error: "senderId must be a valid integer",
        code: "INVALID_SENDER_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(receiverId))) {
      return NextResponse.json({ 
        error: "receiverId must be a valid integer",
        code: "INVALID_RECEIVER_ID" 
      }, { status: 400 });
    }

    const senderIdInt = parseInt(senderId);
    const receiverIdInt = parseInt(receiverId);

    // Validate sender cannot equal receiver
    if (senderIdInt === receiverIdInt) {
      return NextResponse.json({ 
        error: "Cannot send message to yourself",
        code: "SENDER_EQUALS_RECEIVER" 
      }, { status: 400 });
    }

    // Validate senderId exists
    const senderExists = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, senderIdInt))
      .limit(1);

    if (senderExists.length === 0) {
      return NextResponse.json({ 
        error: "Sender user does not exist",
        code: "SENDER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate receiverId exists
    const receiverExists = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, receiverIdInt))
      .limit(1);

    if (receiverExists.length === 0) {
      return NextResponse.json({ 
        error: "Receiver user does not exist",
        code: "RECEIVER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Create new message
    const newMessage = await db.insert(messages)
      .values({
        senderId: senderIdInt,
        receiverId: receiverIdInt,
        content: content.trim(),
        readAt: null,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newMessage[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID is provided
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const messageId = parseInt(id);

    // Check if message exists
    const existingMessage = await db.select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (existingMessage.length === 0) {
      return NextResponse.json({ 
        error: 'Message not found',
        code: "MESSAGE_NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { readAt } = body;

    // Prepare update data
    const updateData: any = {};

    // Update readAt field (typically to mark as read)
    if (readAt !== undefined) {
      updateData.readAt = readAt;
    } else {
      // If no readAt provided, set it to current timestamp (mark as read)
      updateData.readAt = new Date().toISOString();
    }

    // Update message
    const updatedMessage = await db.update(messages)
      .set(updateData)
      .where(eq(messages.id, messageId))
      .returning();

    return NextResponse.json(updatedMessage[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID is provided
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const messageId = parseInt(id);

    // Check if message exists
    const existingMessage = await db.select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (existingMessage.length === 0) {
      return NextResponse.json({ 
        error: 'Message not found',
        code: "MESSAGE_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete message
    const deletedMessage = await db.delete(messages)
      .where(eq(messages.id, messageId))
      .returning();

    return NextResponse.json({ 
      message: 'Message deleted successfully',
      data: deletedMessage[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}