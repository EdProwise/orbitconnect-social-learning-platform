import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { connections, users } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

// Helper function to validate status
function isValidStatus(status: string): boolean {
  return ['PENDING', 'ACCEPTED', 'REJECTED'].includes(status);
}

// Helper function to check if user exists
async function userExists(userId: number): Promise<boolean> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user.length > 0;
}

// Helper function to check for duplicate connection
async function connectionExists(requesterId: number, receiverId: number): Promise<boolean> {
  const existing = await db.select()
    .from(connections)
    .where(
      and(
        eq(connections.requesterId, requesterId),
        eq(connections.receiverId, receiverId)
      )
    )
    .limit(1);
  return existing.length > 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single connection by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const connection = await db.select()
        .from(connections)
        .where(eq(connections.id, parseInt(id)))
        .limit(1);

      if (connection.length === 0) {
        return NextResponse.json({ 
          error: 'Connection not found',
          code: 'CONNECTION_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(connection[0], { status: 200 });
    }

    // List connections with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const requesterId = searchParams.get('requesterId');
    const receiverId = searchParams.get('receiverId');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    let query = db.select().from(connections);

    // Build where conditions
    const conditions = [];

    if (userId) {
      const userIdInt = parseInt(userId);
      if (isNaN(userIdInt)) {
        return NextResponse.json({ 
          error: "Valid user ID is required",
          code: "INVALID_USER_ID" 
        }, { status: 400 });
      }
      // Return all connections where user is requester or receiver
      conditions.push(
        or(
          eq(connections.requesterId, userIdInt),
          eq(connections.receiverId, userIdInt)
        )
      );
    } else {
      if (requesterId) {
        const requesterIdInt = parseInt(requesterId);
        if (isNaN(requesterIdInt)) {
          return NextResponse.json({ 
            error: "Valid requester ID is required",
            code: "INVALID_REQUESTER_ID" 
          }, { status: 400 });
        }
        conditions.push(eq(connections.requesterId, requesterIdInt));
      }

      if (receiverId) {
        const receiverIdInt = parseInt(receiverId);
        if (isNaN(receiverIdInt)) {
          return NextResponse.json({ 
            error: "Valid receiver ID is required",
            code: "INVALID_RECEIVER_ID" 
          }, { status: 400 });
        }
        conditions.push(eq(connections.receiverId, receiverIdInt));
      }
    }

    if (status) {
      if (!isValidStatus(status)) {
        return NextResponse.json({ 
          error: "Status must be one of: PENDING, ACCEPTED, REJECTED",
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      conditions.push(eq(connections.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(connections.createdAt))
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
    const { requesterId, receiverId } = body;

    // Validate required fields
    if (!requesterId) {
      return NextResponse.json({ 
        error: "Requester ID is required",
        code: "MISSING_REQUESTER_ID" 
      }, { status: 400 });
    }

    if (!receiverId) {
      return NextResponse.json({ 
        error: "Receiver ID is required",
        code: "MISSING_RECEIVER_ID" 
      }, { status: 400 });
    }

    // Validate IDs are numbers
    if (isNaN(parseInt(requesterId))) {
      return NextResponse.json({ 
        error: "Valid requester ID is required",
        code: "INVALID_REQUESTER_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(receiverId))) {
      return NextResponse.json({ 
        error: "Valid receiver ID is required",
        code: "INVALID_RECEIVER_ID" 
      }, { status: 400 });
    }

    const requesterIdInt = parseInt(requesterId);
    const receiverIdInt = parseInt(receiverId);

    // Validate: requesterId cannot equal receiverId
    if (requesterIdInt === receiverIdInt) {
      return NextResponse.json({ 
        error: "Cannot send connection request to yourself",
        code: "SELF_CONNECTION_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate: requesterId must exist
    const requesterExists = await userExists(requesterIdInt);
    if (!requesterExists) {
      return NextResponse.json({ 
        error: "Requester user does not exist",
        code: "REQUESTER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate: receiverId must exist
    const receiverExists = await userExists(receiverIdInt);
    if (!receiverExists) {
      return NextResponse.json({ 
        error: "Receiver user does not exist",
        code: "RECEIVER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Check for duplicate connection
    const duplicate = await connectionExists(requesterIdInt, receiverIdInt);
    if (duplicate) {
      return NextResponse.json({ 
        error: "Connection request already exists between these users",
        code: "DUPLICATE_CONNECTION" 
      }, { status: 400 });
    }

    // Create connection
    const now = new Date().toISOString();
    const newConnection = await db.insert(connections)
      .values({
        requesterId: requesterIdInt,
        receiverId: receiverIdInt,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newConnection[0], { status: 201 });

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

    const connectionId = parseInt(id);

    // Check if connection exists
    const existing = await db.select()
      .from(connections)
      .where(eq(connections.id, connectionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Connection not found',
        code: 'CONNECTION_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status if provided
    if (status && !isValidStatus(status)) {
      return NextResponse.json({ 
        error: "Status must be one of: PENDING, ACCEPTED, REJECTED",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Update connection
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (status) {
      updates.status = status;
    }

    const updated = await db.update(connections)
      .set(updates)
      .where(eq(connections.id, connectionId))
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const connectionId = parseInt(id);

    // Check if connection exists
    const existing = await db.select()
      .from(connections)
      .where(eq(connections.id, connectionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Connection not found',
        code: 'CONNECTION_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete connection
    const deleted = await db.delete(connections)
      .where(eq(connections.id, connectionId))
      .returning();

    return NextResponse.json({
      message: 'Connection deleted successfully',
      connection: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}