import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { comments, posts, users } from '@/db/schema';
import { eq, and, isNull, asc, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single comment by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const comment = await db
        .select()
        .from(comments)
        .where(eq(comments.id, parseInt(id)))
        .limit(1);

      if (comment.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found', code: 'COMMENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(comment[0]);
    }

    // List comments with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const postId = searchParams.get('postId');
    const userId = searchParams.get('userId');
    const parentCommentId = searchParams.get('parentCommentId');

    let query = db.select().from(comments);

    // Build filter conditions
    const conditions = [];

    if (postId) {
      if (isNaN(parseInt(postId))) {
        return NextResponse.json(
          { error: 'Valid postId is required', code: 'INVALID_POST_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(comments.postId, parseInt(postId)));
    }

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(comments.userId, parseInt(userId)));
    }

    if (parentCommentId !== null) {
      if (parentCommentId === 'null' || parentCommentId === '') {
        conditions.push(isNull(comments.parentCommentId));
      } else {
        if (isNaN(parseInt(parentCommentId))) {
          return NextResponse.json(
            { error: 'Valid parentCommentId is required', code: 'INVALID_PARENT_COMMENT_ID' },
            { status: 400 }
          );
        }
        conditions.push(eq(comments.parentCommentId, parseInt(parentCommentId)));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(asc(comments.createdAt))
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
    const { postId, userId, content, parentCommentId } = body;

    // Validate required fields
    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required', code: 'MISSING_POST_ID' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'content is required', code: 'MISSING_CONTENT' },
        { status: 400 }
      );
    }

    // Validate postId is a valid integer
    if (isNaN(parseInt(postId))) {
      return NextResponse.json(
        { error: 'Valid postId is required', code: 'INVALID_POST_ID' },
        { status: 400 }
      );
    }

    // Validate userId is a valid integer
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate postId exists
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

    // Validate userId exists
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

    // Validate parentCommentId if provided
    if (parentCommentId !== undefined && parentCommentId !== null) {
      if (isNaN(parseInt(parentCommentId))) {
        return NextResponse.json(
          { error: 'Valid parentCommentId is required', code: 'INVALID_PARENT_COMMENT_ID' },
          { status: 400 }
        );
      }

      const parentExists = await db
        .select()
        .from(comments)
        .where(eq(comments.id, parseInt(parentCommentId)))
        .limit(1);

      if (parentExists.length === 0) {
        return NextResponse.json(
          { error: 'Parent comment not found', code: 'PARENT_COMMENT_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    // Create new comment
    const now = new Date().toISOString();
    const newComment = await db
      .insert(comments)
      .values({
        postId: parseInt(postId),
        userId: parseInt(userId),
        content: content.trim(),
        parentCommentId: parentCommentId ? parseInt(parentCommentId) : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newComment[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content } = body;

    // Validate content
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'content is required', code: 'MISSING_CONTENT' },
        { status: 400 }
      );
    }

    // Check if comment exists
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, parseInt(id)))
      .limit(1);

    if (existingComment.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found', code: 'COMMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update comment
    const updated = await db
      .update(comments)
      .set({
        content: content.trim(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(comments.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
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

    // Check if comment exists
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, parseInt(id)))
      .limit(1);

    if (existingComment.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found', code: 'COMMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete comment
    const deleted = await db
      .delete(comments)
      .where(eq(comments.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Comment deleted successfully',
      comment: deleted[0],
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}