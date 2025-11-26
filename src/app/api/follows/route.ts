import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { follows, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const followerId = searchParams.get('followerId');
    const followingId = searchParams.get('followingId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Get single follow by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const follow = await db
        .select()
        .from(follows)
        .where(eq(follows.id, parseInt(id)))
        .limit(1);

      if (follow.length === 0) {
        return NextResponse.json(
          { error: 'Follow not found', code: 'FOLLOW_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(follow[0]);
    }

    // Build query with filters
    let query = db.select().from(follows);
    const conditions = [];

    if (followerId) {
      if (isNaN(parseInt(followerId))) {
        return NextResponse.json(
          { error: 'Valid followerId is required', code: 'INVALID_FOLLOWER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(follows.followerId, parseInt(followerId)));
    }

    if (followingId) {
      if (isNaN(parseInt(followingId))) {
        return NextResponse.json(
          { error: 'Valid followingId is required', code: 'INVALID_FOLLOWING_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(follows.followingId, parseInt(followingId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(follows.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { followerId, followingId } = body;

    // Validate required fields
    if (!followerId) {
      return NextResponse.json(
        { error: 'followerId is required', code: 'MISSING_FOLLOWER_ID' },
        { status: 400 }
      );
    }

    if (!followingId) {
      return NextResponse.json(
        { error: 'followingId is required', code: 'MISSING_FOLLOWING_ID' },
        { status: 400 }
      );
    }

    // Validate field types
    if (typeof followerId !== 'number' || isNaN(followerId)) {
      return NextResponse.json(
        { error: 'followerId must be a valid integer', code: 'INVALID_FOLLOWER_ID' },
        { status: 400 }
      );
    }

    if (typeof followingId !== 'number' || isNaN(followingId)) {
      return NextResponse.json(
        { error: 'followingId must be a valid integer', code: 'INVALID_FOLLOWING_ID' },
        { status: 400 }
      );
    }

    // Check if trying to follow yourself
    if (followerId === followingId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself', code: 'SELF_FOLLOW_NOT_ALLOWED' },
        { status: 400 }
      );
    }

    // Verify follower user exists
    const followerUser = await db
      .select()
      .from(users)
      .where(eq(users.id, followerId))
      .limit(1);

    if (followerUser.length === 0) {
      return NextResponse.json(
        { error: 'Follower user does not exist', code: 'FOLLOWER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Verify following user exists
    const followingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, followingId))
      .limit(1);

    if (followingUser.length === 0) {
      return NextResponse.json(
        { error: 'Following user does not exist', code: 'FOLLOWING_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Check for duplicate follow
    const existingFollow = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      )
      .limit(1);

    if (existingFollow.length > 0) {
      return NextResponse.json(
        { error: 'Follow relationship already exists', code: 'DUPLICATE_FOLLOW' },
        { status: 400 }
      );
    }

    // Create follow relationship
    const newFollow = await db
      .insert(follows)
      .values({
        followerId,
        followingId,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newFollow[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followerId = searchParams.get('followerId');
    const followingId = searchParams.get('followingId');

    // Validate required parameters
    if (!followerId) {
      return NextResponse.json(
        { error: 'followerId is required', code: 'MISSING_FOLLOWER_ID' },
        { status: 400 }
      );
    }

    if (!followingId) {
      return NextResponse.json(
        { error: 'followingId is required', code: 'MISSING_FOLLOWING_ID' },
        { status: 400 }
      );
    }

    // Validate field types
    if (isNaN(parseInt(followerId))) {
      return NextResponse.json(
        { error: 'followerId must be a valid integer', code: 'INVALID_FOLLOWER_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(followingId))) {
      return NextResponse.json(
        { error: 'followingId must be a valid integer', code: 'INVALID_FOLLOWING_ID' },
        { status: 400 }
      );
    }

    // Check if follow relationship exists
    const existingFollow = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, parseInt(followerId)),
          eq(follows.followingId, parseInt(followingId))
        )
      )
      .limit(1);

    if (existingFollow.length === 0) {
      return NextResponse.json(
        { error: 'Follow relationship not found', code: 'FOLLOW_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the follow relationship
    const deleted = await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, parseInt(followerId)),
          eq(follows.followingId, parseInt(followingId))
        )
      )
      .returning();

    return NextResponse.json({
      message: 'Follow relationship deleted successfully',
      deleted: deleted[0],
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}