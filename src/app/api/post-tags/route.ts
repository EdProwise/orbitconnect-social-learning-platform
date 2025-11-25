import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { postTags, posts, tags } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const postId = searchParams.get('postId');
    const tagId = searchParams.get('tagId');

    // Get single post-tag association by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const association = await db
        .select()
        .from(postTags)
        .where(eq(postTags.id, parseInt(id)))
        .limit(1);

      if (association.length === 0) {
        return NextResponse.json(
          { error: 'Post-tag association not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(association[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select().from(postTags);

    // Filter by postId
    if (postId) {
      if (isNaN(parseInt(postId))) {
        return NextResponse.json(
          { error: 'Valid postId is required', code: 'INVALID_POST_ID' },
          { status: 400 }
        );
      }
      query = query.where(eq(postTags.postId, parseInt(postId)));
    }

    // Filter by tagId
    if (tagId) {
      if (isNaN(parseInt(tagId))) {
        return NextResponse.json(
          { error: 'Valid tagId is required', code: 'INVALID_TAG_ID' },
          { status: 400 }
        );
      }

      if (postId) {
        query = query.where(
          and(
            eq(postTags.postId, parseInt(postId)),
            eq(postTags.tagId, parseInt(tagId))
          )
        );
      } else {
        query = query.where(eq(postTags.tagId, parseInt(tagId)));
      }
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
    const { postId, tagId } = body;

    // Validate required fields
    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required', code: 'MISSING_POST_ID' },
        { status: 400 }
      );
    }

    if (!tagId) {
      return NextResponse.json(
        { error: 'tagId is required', code: 'MISSING_TAG_ID' },
        { status: 400 }
      );
    }

    // Validate IDs are valid integers
    if (isNaN(parseInt(postId))) {
      return NextResponse.json(
        { error: 'postId must be a valid integer', code: 'INVALID_POST_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(tagId))) {
      return NextResponse.json(
        { error: 'tagId must be a valid integer', code: 'INVALID_TAG_ID' },
        { status: 400 }
      );
    }

    const parsedPostId = parseInt(postId);
    const parsedTagId = parseInt(tagId);

    // Verify post exists
    const existingPost = await db
      .select()
      .from(posts)
      .where(eq(posts.id, parsedPostId))
      .limit(1);

    if (existingPost.length === 0) {
      return NextResponse.json(
        { error: 'Post not found', code: 'POST_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Verify tag exists
    const existingTag = await db
      .select()
      .from(tags)
      .where(eq(tags.id, parsedTagId))
      .limit(1);

    if (existingTag.length === 0) {
      return NextResponse.json(
        { error: 'Tag not found', code: 'TAG_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Check for duplicate association
    const duplicateCheck = await db
      .select()
      .from(postTags)
      .where(
        and(
          eq(postTags.postId, parsedPostId),
          eq(postTags.tagId, parsedTagId)
        )
      )
      .limit(1);

    if (duplicateCheck.length > 0) {
      return NextResponse.json(
        {
          error: 'Post-tag association already exists',
          code: 'DUPLICATE_ASSOCIATION',
        },
        { status: 400 }
      );
    }

    // Create new post-tag association
    const newAssociation = await db
      .insert(postTags)
      .values({
        postId: parsedPostId,
        tagId: parsedTagId,
      })
      .returning();

    // Increment tag trendingScore
    await db
      .update(tags)
      .set({
        trendingScore: sql`${tags.trendingScore} + 1`,
      })
      .where(eq(tags.id, parsedTagId));

    return NextResponse.json(newAssociation[0], { status: 201 });
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);

    // Check if association exists
    const existingAssociation = await db
      .select()
      .from(postTags)
      .where(eq(postTags.id, parsedId))
      .limit(1);

    if (existingAssociation.length === 0) {
      return NextResponse.json(
        { error: 'Post-tag association not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const associationTagId = existingAssociation[0].tagId;

    // Delete the association
    const deleted = await db
      .delete(postTags)
      .where(eq(postTags.id, parsedId))
      .returning();

    // Decrement tag trendingScore (minimum 0)
    await db
      .update(tags)
      .set({
        trendingScore: sql`MAX(0, ${tags.trendingScore} - 1)`,
      })
      .where(eq(tags.id, associationTagId));

    return NextResponse.json(
      {
        message: 'Post-tag association deleted successfully',
        deleted: deleted[0],
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