import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, users } from '@/db/schema';
import { eq, like, and, or, desc, sql } from 'drizzle-orm';

const VALID_POST_TYPES = ['ARTICLE', 'PHOTO_VIDEO', 'QUESTION', 'CELEBRATE', 'POLL', 'STUDY_MATERIAL', 'DONATE_BOOKS'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single post by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const post = await db.select()
        .from(posts)
        .where(eq(posts.id, parseInt(id)))
        .limit(1);

      if (post.length === 0) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      // Increment view count
      await db.update(posts)
        .set({ 
          viewCount: sql`${posts.viewCount} + 1`
        })
        .where(eq(posts.id, parseInt(id)));

      // Fetch updated post with incremented view count
      const updatedPost = await db.select()
        .from(posts)
        .where(eq(posts.id, parseInt(id)))
        .limit(1);

      const postData = updatedPost[0];
      
      // Parse JSON fields
      return NextResponse.json({
        ...postData,
        mediaUrls: postData.mediaUrls ? JSON.parse(postData.mediaUrls as string) : null,
        pollOptions: postData.pollOptions ? JSON.parse(postData.pollOptions as string) : null,
        fileUrls: postData.fileUrls ? JSON.parse(postData.fileUrls as string) : null,
      });
    }

    // List posts with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const schoolId = searchParams.get('schoolId');

    let query = db.select().from(posts);
    const conditions = [];

    // Search by title or content
    if (search) {
      conditions.push(
        or(
          like(posts.title, `%${search}%`),
          like(posts.content, `%${search}%`)
        )
      );
    }

    // Filter by type
    if (type) {
      if (!VALID_POST_TYPES.includes(type)) {
        return NextResponse.json({ 
          error: "Invalid post type",
          code: "INVALID_POST_TYPE",
          validTypes: VALID_POST_TYPES
        }, { status: 400 });
      }
      conditions.push(eq(posts.type, type));
    }

    // Filter by userId
    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json({ 
          error: "Valid userId is required",
          code: "INVALID_USER_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(posts.userId, parseInt(userId)));
    }

    // Filter by schoolId
    if (schoolId) {
      if (isNaN(parseInt(schoolId))) {
        return NextResponse.json({ 
          error: "Valid schoolId is required",
          code: "INVALID_SCHOOL_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(posts.schoolId, parseInt(schoolId)));
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting, pagination
    const results = await query
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Parse JSON fields for all posts
    const parsedResults = results.map(post => ({
      ...post,
      mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls as string) : null,
      pollOptions: post.pollOptions ? JSON.parse(post.pollOptions as string) : null,
      fileUrls: post.fileUrls ? JSON.parse(post.fileUrls as string) : null,
    }));

    return NextResponse.json(parsedResults);
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
    const { userId, type, title, schoolId, content, mediaUrls, pollOptions, fileUrls } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(userId))) {
      return NextResponse.json({ 
        error: "Valid userId is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ 
        error: "type is required",
        code: "MISSING_TYPE" 
      }, { status: 400 });
    }

    if (!VALID_POST_TYPES.includes(type)) {
      return NextResponse.json({ 
        error: "Invalid post type",
        code: "INVALID_POST_TYPE",
        validTypes: VALID_POST_TYPES
      }, { status: 400 });
    }

    if (!title || title.trim() === '') {
      return NextResponse.json({ 
        error: "title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    // Validate userId exists
    const userExists = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({ 
        error: "User not found",
        code: "USER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate schoolId if provided
    if (schoolId && isNaN(parseInt(schoolId))) {
      return NextResponse.json({ 
        error: "Valid schoolId is required",
        code: "INVALID_SCHOOL_ID" 
      }, { status: 400 });
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData: any = {
      userId: parseInt(userId),
      type,
      title: title.trim(),
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (schoolId) {
      insertData.schoolId = parseInt(schoolId);
    }

    if (content) {
      insertData.content = content.trim();
    }

    // Handle JSON fields
    if (mediaUrls) {
      if (!Array.isArray(mediaUrls)) {
        return NextResponse.json({ 
          error: "mediaUrls must be an array",
          code: "INVALID_MEDIA_URLS" 
        }, { status: 400 });
      }
      insertData.mediaUrls = JSON.stringify(mediaUrls);
    }

    if (pollOptions) {
      if (!Array.isArray(pollOptions)) {
        return NextResponse.json({ 
          error: "pollOptions must be an array",
          code: "INVALID_POLL_OPTIONS" 
        }, { status: 400 });
      }
      insertData.pollOptions = JSON.stringify(pollOptions);
    }

    if (fileUrls) {
      if (!Array.isArray(fileUrls)) {
        return NextResponse.json({ 
          error: "fileUrls must be an array",
          code: "INVALID_FILE_URLS" 
        }, { status: 400 });
      }
      insertData.fileUrls = JSON.stringify(fileUrls);
    }

    const newPost = await db.insert(posts)
      .values(insertData)
      .returning();

    // Parse JSON fields in response
    const postData = newPost[0];
    return NextResponse.json({
      ...postData,
      mediaUrls: postData.mediaUrls ? JSON.parse(postData.mediaUrls as string) : null,
      pollOptions: postData.pollOptions ? JSON.parse(postData.pollOptions as string) : null,
      fileUrls: postData.fileUrls ? JSON.parse(postData.fileUrls as string) : null,
    }, { status: 201 });
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if post exists
    const existingPost = await db.select()
      .from(posts)
      .where(eq(posts.id, parseInt(id)))
      .limit(1);

    if (existingPost.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const body = await request.json();
    const { type, title, schoolId, content, mediaUrls, pollOptions, fileUrls } = body;

    // Validate type if provided
    if (type && !VALID_POST_TYPES.includes(type)) {
      return NextResponse.json({ 
        error: "Invalid post type",
        code: "INVALID_POST_TYPE",
        validTypes: VALID_POST_TYPES
      }, { status: 400 });
    }

    // Validate title if provided
    if (title !== undefined && (!title || title.trim() === '')) {
      return NextResponse.json({ 
        error: "title cannot be empty",
        code: "INVALID_TITLE" 
      }, { status: 400 });
    }

    // Validate schoolId if provided
    if (schoolId && isNaN(parseInt(schoolId))) {
      return NextResponse.json({ 
        error: "Valid schoolId is required",
        code: "INVALID_SCHOOL_ID" 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (type) updateData.type = type;
    if (title) updateData.title = title.trim();
    if (schoolId !== undefined) updateData.schoolId = schoolId ? parseInt(schoolId) : null;
    if (content !== undefined) updateData.content = content ? content.trim() : null;

    // Handle JSON fields
    if (mediaUrls !== undefined) {
      if (mediaUrls !== null && !Array.isArray(mediaUrls)) {
        return NextResponse.json({ 
          error: "mediaUrls must be an array or null",
          code: "INVALID_MEDIA_URLS" 
        }, { status: 400 });
      }
      updateData.mediaUrls = mediaUrls ? JSON.stringify(mediaUrls) : null;
    }

    if (pollOptions !== undefined) {
      if (pollOptions !== null && !Array.isArray(pollOptions)) {
        return NextResponse.json({ 
          error: "pollOptions must be an array or null",
          code: "INVALID_POLL_OPTIONS" 
        }, { status: 400 });
      }
      updateData.pollOptions = pollOptions ? JSON.stringify(pollOptions) : null;
    }

    if (fileUrls !== undefined) {
      if (fileUrls !== null && !Array.isArray(fileUrls)) {
        return NextResponse.json({ 
          error: "fileUrls must be an array or null",
          code: "INVALID_FILE_URLS" 
        }, { status: 400 });
      }
      updateData.fileUrls = fileUrls ? JSON.stringify(fileUrls) : null;
    }

    const updated = await db.update(posts)
      .set(updateData)
      .where(eq(posts.id, parseInt(id)))
      .returning();

    // Parse JSON fields in response
    const postData = updated[0];
    return NextResponse.json({
      ...postData,
      mediaUrls: postData.mediaUrls ? JSON.parse(postData.mediaUrls as string) : null,
      pollOptions: postData.pollOptions ? JSON.parse(postData.pollOptions as string) : null,
      fileUrls: postData.fileUrls ? JSON.parse(postData.fileUrls as string) : null,
    });
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
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if post exists before deleting
    const existingPost = await db.select()
      .from(posts)
      .where(eq(posts.id, parseInt(id)))
      .limit(1);

    if (existingPost.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const deleted = await db.delete(posts)
      .where(eq(posts.id, parseInt(id)))
      .returning();

    // Parse JSON fields in response
    const postData = deleted[0];
    return NextResponse.json({
      message: 'Post deleted successfully',
      post: {
        ...postData,
        mediaUrls: postData.mediaUrls ? JSON.parse(postData.mediaUrls as string) : null,
        pollOptions: postData.pollOptions ? JSON.parse(postData.pollOptions as string) : null,
        fileUrls: postData.fileUrls ? JSON.parse(postData.fileUrls as string) : null,
      }
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}