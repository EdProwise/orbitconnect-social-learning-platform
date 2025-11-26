import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { follows, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followerIdParam = searchParams.get('followerId');
    const followingIdParam = searchParams.get('followingId');

    // Validate followerId presence
    if (!followerIdParam) {
      return NextResponse.json(
        { 
          error: 'followerId is required',
          code: 'MISSING_FOLLOWER_ID' 
        },
        { status: 400 }
      );
    }

    // Validate followingId presence
    if (!followingIdParam) {
      return NextResponse.json(
        { 
          error: 'followingId is required',
          code: 'MISSING_FOLLOWING_ID' 
        },
        { status: 400 }
      );
    }

    // Validate followerId is valid integer
    const followerId = parseInt(followerIdParam);
    if (isNaN(followerId)) {
      return NextResponse.json(
        { 
          error: 'followerId must be a valid integer',
          code: 'INVALID_FOLLOWER_ID' 
        },
        { status: 400 }
      );
    }

    // Validate followingId is valid integer
    const followingId = parseInt(followingIdParam);
    if (isNaN(followingId)) {
      return NextResponse.json(
        { 
          error: 'followingId must be a valid integer',
          code: 'INVALID_FOLLOWING_ID' 
        },
        { status: 400 }
      );
    }

    // Validate follower user exists
    const followerUser = await db.select()
      .from(users)
      .where(eq(users.id, followerId))
      .limit(1);

    if (followerUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'Follower user does not exist',
          code: 'FOLLOWER_NOT_FOUND' 
        },
        { status: 400 }
      );
    }

    // Validate following user exists
    const followingUser = await db.select()
      .from(users)
      .where(eq(users.id, followingId))
      .limit(1);

    if (followingUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'Following user does not exist',
          code: 'FOLLOWING_NOT_FOUND' 
        },
        { status: 400 }
      );
    }

    // Check if follow relationship exists
    const followRecord = await db.select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      )
      .limit(1);

    const isFollowing = followRecord.length > 0;

    return NextResponse.json({
      isFollowing,
      followerId,
      followingId
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}