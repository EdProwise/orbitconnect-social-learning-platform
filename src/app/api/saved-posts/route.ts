import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { savedPosts, users, posts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single saved post by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const savedPost = await db.select()
        .from(savedPosts)
        .where(eq(savedPosts.id, parseInt(id)))
        .limit(1);

      if (savedPost.length === 0) {
        return NextResponse.json({ 
          error: 'Saved post not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(savedPost[0], { status: 200 });
    }

    // List saved posts with filtering and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userIdParam = searchParams.get('userId');
    const postIdParam = searchParams.get('postId');

    let query = db.select().from(savedPosts);

    // Build where conditions
    const conditions = [];
    
    if (userIdParam) {
      if (isNaN(parseInt(userIdParam))) {
        return NextResponse.json({ 
          error: "Valid userId is required",
          code: "INVALID_USER_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(savedPosts.userId, parseInt(userIdParam)));
    }

    if (postIdParam) {
      if (isNaN(parseInt(postIdParam))) {
        return NextResponse.json({ 
          error: "Valid postId is required",
          code: "INVALID_POST_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(savedPosts.postId, parseInt(postIdParam)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(savedPosts.createdAt))
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
    const { userId, postId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (!postId) {
      return NextResponse.json({ 
        error: "postId is required",
        code: "MISSING_POST_ID" 
      }, { status: 400 });
    }

    // Validate userId and postId are valid integers
    if (isNaN(parseInt(userId))) {
      return NextResponse.json({ 
        error: "Valid userId is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(postId))) {
      return NextResponse.json({ 
        error: "Valid postId is required",
        code: "INVALID_POST_ID" 
      }, { status: 400 });
    }

    // Validate user exists
    const userExists = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({ 
        error: "User does not exist",
        code: "USER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate post exists
    const postExists = await db.select()
      .from(posts)
      .where(eq(posts.id, parseInt(postId)))
      .limit(1);

    if (postExists.length === 0) {
      return NextResponse.json({ 
        error: "Post does not exist",
        code: "POST_NOT_FOUND" 
      }, { status: 400 });
    }

    // Check for duplicate save (unique constraint on userId + postId)
    const existingSave = await db.select()
      .from(savedPosts)
      .where(
        and(
          eq(savedPosts.userId, parseInt(userId)),
          eq(savedPosts.postId, parseInt(postId))
        )
      )
      .limit(1);

    if (existingSave.length > 0) {
      return NextResponse.json({ 
        error: "Post already saved by this user",
        code: "DUPLICATE_SAVE" 
      }, { status: 400 });
    }

    // Create saved post
    const newSavedPost = await db.insert(savedPosts)
      .values({
        userId: parseInt(userId),
        postId: parseInt(postId),
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newSavedPost[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
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

    // Check if saved post exists
    const existingSavedPost = await db.select()
      .from(savedPosts)
      .where(eq(savedPosts.id, parseInt(id)))
      .limit(1);

    if (existingSavedPost.length === 0) {
      return NextResponse.json({ 
        error: 'Saved post not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete saved post
    const deleted = await db.delete(savedPosts)
      .where(eq(savedPosts.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Saved post removed successfully',
      data: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}