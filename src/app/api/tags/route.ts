import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tags } from '@/db/schema';
import { eq, like, desc, asc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single tag by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const tag = await db.select()
        .from(tags)
        .where(eq(tags.id, parseInt(id)))
        .limit(1);

      if (tag.length === 0) {
        return NextResponse.json({ 
          error: 'Tag not found',
          code: "TAG_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(tag[0], { status: 200 });
    }

    // List tags with pagination, search, and sorting
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') ?? 'trending';

    let query = db.select().from(tags);

    // Apply search filter
    if (search) {
      query = query.where(like(tags.name, `%${search}%`));
    }

    // Apply sorting
    if (sort === 'trending') {
      query = query.orderBy(desc(tags.trendingScore));
    } else if (sort === 'name') {
      query = query.orderBy(asc(tags.name));
    } else if (sort === 'recent') {
      query = query.orderBy(desc(tags.createdAt));
    } else {
      // Default to trending if invalid sort parameter
      query = query.orderBy(desc(tags.trendingScore));
    }

    const results = await query.limit(limit).offset(offset);

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
    const { name } = body;

    // Validation: name is required
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ 
        error: "Name is required and must be a string",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    // Trim and validate name
    const trimmedName = name.trim();
    
    if (trimmedName.length === 0) {
      return NextResponse.json({ 
        error: "Name cannot be empty",
        code: "INVALID_NAME" 
      }, { status: 400 });
    }

    if (trimmedName.length > 50) {
      return NextResponse.json({ 
        error: "Name cannot exceed 50 characters",
        code: "NAME_TOO_LONG" 
      }, { status: 400 });
    }

    // Check for duplicate name
    const existingTag = await db.select()
      .from(tags)
      .where(eq(tags.name, trimmedName))
      .limit(1);

    if (existingTag.length > 0) {
      return NextResponse.json({ 
        error: "A tag with this name already exists",
        code: "DUPLICATE_NAME" 
      }, { status: 400 });
    }

    // Create new tag
    const newTag = await db.insert(tags)
      .values({
        name: trimmedName,
        trendingScore: 0,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newTag[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
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

    const tagId = parseInt(id);

    // Check if tag exists
    const existingTag = await db.select()
      .from(tags)
      .where(eq(tags.id, tagId))
      .limit(1);

    if (existingTag.length === 0) {
      return NextResponse.json({ 
        error: 'Tag not found',
        code: "TAG_NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, trendingScore } = body;

    const updates: Partial<typeof tags.$inferInsert> = {};

    // Validate and update name if provided
    if (name !== undefined) {
      if (typeof name !== 'string') {
        return NextResponse.json({ 
          error: "Name must be a string",
          code: "INVALID_NAME_TYPE" 
        }, { status: 400 });
      }

      const trimmedName = name.trim();
      
      if (trimmedName.length === 0) {
        return NextResponse.json({ 
          error: "Name cannot be empty",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }

      if (trimmedName.length > 50) {
        return NextResponse.json({ 
          error: "Name cannot exceed 50 characters",
          code: "NAME_TOO_LONG" 
        }, { status: 400 });
      }

      // Check for duplicate name (excluding current tag)
      const duplicateTag = await db.select()
        .from(tags)
        .where(and(
          eq(tags.name, trimmedName),
          // Exclude current tag from duplicate check
        ))
        .limit(1);

      if (duplicateTag.length > 0 && duplicateTag[0].id !== tagId) {
        return NextResponse.json({ 
          error: "A tag with this name already exists",
          code: "DUPLICATE_NAME" 
        }, { status: 400 });
      }

      updates.name = trimmedName;
    }

    // Validate and update trendingScore if provided
    if (trendingScore !== undefined) {
      if (typeof trendingScore !== 'number' || !Number.isInteger(trendingScore)) {
        return NextResponse.json({ 
          error: "Trending score must be an integer",
          code: "INVALID_TRENDING_SCORE_TYPE" 
        }, { status: 400 });
      }

      if (trendingScore < 0) {
        return NextResponse.json({ 
          error: "Trending score must be non-negative",
          code: "INVALID_TRENDING_SCORE" 
        }, { status: 400 });
      }

      updates.trendingScore = trendingScore;
    }

    // Check if there are any updates to apply
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATES" 
      }, { status: 400 });
    }

    // Perform update
    const updatedTag = await db.update(tags)
      .set(updates)
      .where(eq(tags.id, tagId))
      .returning();

    return NextResponse.json(updatedTag[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
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

    const tagId = parseInt(id);

    // Check if tag exists
    const existingTag = await db.select()
      .from(tags)
      .where(eq(tags.id, tagId))
      .limit(1);

    if (existingTag.length === 0) {
      return NextResponse.json({ 
        error: 'Tag not found',
        code: "TAG_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete tag
    const deleted = await db.delete(tags)
      .where(eq(tags.id, tagId))
      .returning();

    return NextResponse.json({ 
      message: 'Tag deleted successfully',
      tag: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}