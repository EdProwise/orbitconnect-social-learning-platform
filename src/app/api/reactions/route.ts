import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reactions, posts, comments, users } from '@/db/schema';
import { eq, and, or, isNull, isNotNull } from 'drizzle-orm';

const VALID_REACTION_TYPES = ['LIKE', 'LOVE', 'INSIGHTFUL', 'SUPPORT'] as const;
type ReactionType = typeof VALID_REACTION_TYPES[number];

function isValidReactionType(type: string): type is ReactionType {
  return VALID_REACTION_TYPES.includes(type as ReactionType);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single reaction by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const reaction = await db
        .select()
        .from(reactions)
        .where(eq(reactions.id, parseInt(id)))
        .limit(1);

      if (reaction.length === 0) {
        return NextResponse.json(
          { error: 'Reaction not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(reaction[0], { status: 200 });
    }

    // List reactions with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const postId = searchParams.get('postId');
    const commentId = searchParams.get('commentId');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    let query = db.select().from(reactions);

    const conditions = [];

    if (postId) {
      if (isNaN(parseInt(postId))) {
        return NextResponse.json(
          { error: 'Valid postId is required', code: 'INVALID_POST_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(reactions.postId, parseInt(postId)));
    }

    if (commentId) {
      if (isNaN(parseInt(commentId))) {
        return NextResponse.json(
          { error: 'Valid commentId is required', code: 'INVALID_COMMENT_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(reactions.commentId, parseInt(commentId)));
    }

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(reactions.userId, parseInt(userId)));
    }

    if (type) {
      if (!isValidReactionType(type)) {
        return NextResponse.json(
          {
            error: `Invalid reaction type. Must be one of: ${VALID_REACTION_TYPES.join(', ')}`,
            code: 'INVALID_TYPE',
          },
          { status: 400 }
        );
      }
      conditions.push(eq(reactions.type, type));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
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
    const { postId, commentId, userId, type } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    // Validate type
    if (!isValidReactionType(type)) {
      return NextResponse.json(
        {
          error: `Invalid reaction type. Must be one of: ${VALID_REACTION_TYPES.join(', ')}`,
          code: 'INVALID_TYPE',
        },
        { status: 400 }
      );
    }

    // Validate either postId OR commentId (not both, not neither)
    if (!postId && !commentId) {
      return NextResponse.json(
        {
          error: 'Either postId or commentId must be provided',
          code: 'MISSING_TARGET',
        },
        { status: 400 }
      );
    }

    if (postId && commentId) {
      return NextResponse.json(
        {
          error: 'Cannot react to both post and comment simultaneously',
          code: 'BOTH_TARGETS_PROVIDED',
        },
        { status: 400 }
      );
    }

    // Validate IDs are valid integers
    if (postId && isNaN(parseInt(postId))) {
      return NextResponse.json(
        { error: 'Valid postId is required', code: 'INVALID_POST_ID' },
        { status: 400 }
      );
    }

    if (commentId && isNaN(parseInt(commentId))) {
      return NextResponse.json(
        { error: 'Valid commentId is required', code: 'INVALID_COMMENT_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Verify user exists
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Verify post or comment exists
    if (postId) {
      const postExists = await db
        .select()
        .from(posts)
        .where(eq(posts.id, parseInt(postId)))
        .limit(1);

      if (postExists.length === 0) {
        return NextResponse.json(
          { error: 'Post not found', code: 'POST_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    if (commentId) {
      const commentExists = await db
        .select()
        .from(comments)
        .where(eq(comments.id, parseInt(commentId)))
        .limit(1);

      if (commentExists.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found', code: 'COMMENT_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    // Enforce single reaction per user per target (post or comment)
    const targetConditions = [eq(reactions.userId, parseInt(userId))];
    if (postId) {
      targetConditions.push(eq(reactions.postId, parseInt(postId)));
    } else {
      targetConditions.push(eq(reactions.commentId, parseInt(commentId)));
    }

    const existingAny = await db
      .select()
      .from(reactions)
      .where(and(...targetConditions))
      .limit(1);

    // If reaction exists and type is same, return existing (idempotent)
    if (existingAny.length > 0) {
      if (existingAny[0].type === type) {
        return NextResponse.json(existingAny[0], { status: 200 });
      }
      // Update existing reaction to new type (allow changing reaction)
      const updated = await db
        .update(reactions)
        .set({ type })
        .where(eq(reactions.id, existingAny[0].id))
        .returning();
      return NextResponse.json(updated[0], { status: 200 });
    }

    // Create the reaction if none exists yet
    const newReaction = await db
      .insert(reactions)
      .values({
        postId: postId ? parseInt(postId) : null,
        commentId: commentId ? parseInt(commentId) : null,
        userId: parseInt(userId),
        type,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newReaction[0], { status: 201 });
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
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if reaction exists
    const existing = await db
      .select()
      .from(reactions)
      .where(eq(reactions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Reaction not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the reaction
    const deleted = await db
      .delete(reactions)
      .where(eq(reactions.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Reaction deleted successfully',
        reaction: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}