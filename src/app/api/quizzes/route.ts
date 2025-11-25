import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { quizzes, users } from '@/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

interface Question {
  question: string;
  options: string[];
  correct: number;
  points: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single quiz by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const quiz = await db.select()
        .from(quizzes)
        .where(eq(quizzes.id, parseInt(id)))
        .limit(1);

      if (quiz.length === 0) {
        return NextResponse.json({ 
          error: 'Quiz not found',
          code: "QUIZ_NOT_FOUND" 
        }, { status: 404 });
      }

      // Parse questions JSON for response
      const quizData = {
        ...quiz[0],
        questions: typeof quiz[0].questions === 'string' 
          ? JSON.parse(quiz[0].questions) 
          : quiz[0].questions
      };

      return NextResponse.json(quizData, { status: 200 });
    }

    // List quizzes with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const creatorId = searchParams.get('creatorId');
    const status = searchParams.get('status');

    let query = db.select().from(quizzes);
    const conditions = [];

    // Filter by creatorId
    if (creatorId) {
      const creatorIdNum = parseInt(creatorId);
      if (isNaN(creatorIdNum)) {
        return NextResponse.json({ 
          error: "Valid creatorId is required",
          code: "INVALID_CREATOR_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(quizzes.creatorId, creatorIdNum));
    }

    // Filter by status based on timestamps
    if (status) {
      const now = new Date().toISOString();
      
      if (status === 'active') {
        // Quiz has started but not ended
        conditions.push(lte(quizzes.startsAt, now));
        conditions.push(gte(quizzes.endsAt, now));
      } else if (status === 'upcoming') {
        // Quiz hasn't started yet
        conditions.push(gte(quizzes.startsAt, now));
      } else if (status === 'ended') {
        // Quiz has ended
        conditions.push(lte(quizzes.endsAt, now));
      } else {
        return NextResponse.json({ 
          error: "Invalid status. Must be 'active', 'upcoming', or 'ended'",
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
    }

    // Apply filters
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sort by createdAt DESC and apply pagination
    const results = await query
      .orderBy(desc(quizzes.createdAt))
      .limit(limit)
      .offset(offset);

    // Parse questions JSON for each quiz in response
    const parsedResults = results.map(quiz => ({
      ...quiz,
      questions: typeof quiz.questions === 'string' 
        ? JSON.parse(quiz.questions) 
        : quiz.questions
    }));

    return NextResponse.json(parsedResults, { status: 200 });
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
    const { title, description, creatorId, durationMinutes, totalPoints, questions, startsAt, endsAt } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!creatorId) {
      return NextResponse.json({ 
        error: "creatorId is required",
        code: "MISSING_CREATOR_ID" 
      }, { status: 400 });
    }

    if (!durationMinutes) {
      return NextResponse.json({ 
        error: "durationMinutes is required",
        code: "MISSING_DURATION" 
      }, { status: 400 });
    }

    if (!totalPoints) {
      return NextResponse.json({ 
        error: "totalPoints is required",
        code: "MISSING_TOTAL_POINTS" 
      }, { status: 400 });
    }

    if (!questions) {
      return NextResponse.json({ 
        error: "questions is required",
        code: "MISSING_QUESTIONS" 
      }, { status: 400 });
    }

    if (!startsAt) {
      return NextResponse.json({ 
        error: "startsAt is required",
        code: "MISSING_STARTS_AT" 
      }, { status: 400 });
    }

    if (!endsAt) {
      return NextResponse.json({ 
        error: "endsAt is required",
        code: "MISSING_ENDS_AT" 
      }, { status: 400 });
    }

    // Validate positive numbers
    if (durationMinutes <= 0) {
      return NextResponse.json({ 
        error: "durationMinutes must be positive",
        code: "INVALID_DURATION" 
      }, { status: 400 });
    }

    if (totalPoints <= 0) {
      return NextResponse.json({ 
        error: "totalPoints must be positive",
        code: "INVALID_TOTAL_POINTS" 
      }, { status: 400 });
    }

    // Validate questions is an array
    if (!Array.isArray(questions)) {
      return NextResponse.json({ 
        error: "questions must be an array",
        code: "INVALID_QUESTIONS_FORMAT" 
      }, { status: 400 });
    }

    // Validate each question has required fields
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i] as Question;
      if (!q.question || !Array.isArray(q.options) || typeof q.correct !== 'number' || typeof q.points !== 'number') {
        return NextResponse.json({ 
          error: `Invalid question format at index ${i}. Each question must have: question (string), options (array), correct (number), points (number)`,
          code: "INVALID_QUESTION_STRUCTURE" 
        }, { status: 400 });
      }
    }

    // Validate date range
    const startsAtDate = new Date(startsAt);
    const endsAtDate = new Date(endsAt);

    if (isNaN(startsAtDate.getTime())) {
      return NextResponse.json({ 
        error: "Invalid startsAt date format",
        code: "INVALID_STARTS_AT" 
      }, { status: 400 });
    }

    if (isNaN(endsAtDate.getTime())) {
      return NextResponse.json({ 
        error: "Invalid endsAt date format",
        code: "INVALID_ENDS_AT" 
      }, { status: 400 });
    }

    if (startsAtDate >= endsAtDate) {
      return NextResponse.json({ 
        error: "startsAt must be before endsAt",
        code: "INVALID_DATE_RANGE" 
      }, { status: 400 });
    }

    // Validate creatorId exists
    const creator = await db.select()
      .from(users)
      .where(eq(users.id, creatorId))
      .limit(1);

    if (creator.length === 0) {
      return NextResponse.json({ 
        error: "creatorId does not reference an existing user",
        code: "INVALID_CREATOR" 
      }, { status: 400 });
    }

    // Create quiz
    const questionsJson = JSON.stringify(questions);
    const now = new Date().toISOString();

    const newQuiz = await db.insert(quizzes)
      .values({
        title: title.trim(),
        description: description?.trim() || null,
        creatorId,
        durationMinutes,
        totalPoints,
        questions: questionsJson,
        startsAt: startsAtDate.toISOString(),
        endsAt: endsAtDate.toISOString(),
        createdAt: now
      })
      .returning();

    // Parse questions for response
    const quizData = {
      ...newQuiz[0],
      questions: JSON.parse(newQuiz[0].questions as string)
    };

    return NextResponse.json(quizData, { status: 201 });
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

    const quizId = parseInt(id);

    // Check if quiz exists
    const existing = await db.select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Quiz not found',
        code: "QUIZ_NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, durationMinutes, totalPoints, questions, startsAt, endsAt } = body;

    // Build update object
    const updates: any = {};

    if (title !== undefined) {
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (durationMinutes !== undefined) {
      if (durationMinutes <= 0) {
        return NextResponse.json({ 
          error: "durationMinutes must be positive",
          code: "INVALID_DURATION" 
        }, { status: 400 });
      }
      updates.durationMinutes = durationMinutes;
    }

    if (totalPoints !== undefined) {
      if (totalPoints <= 0) {
        return NextResponse.json({ 
          error: "totalPoints must be positive",
          code: "INVALID_TOTAL_POINTS" 
        }, { status: 400 });
      }
      updates.totalPoints = totalPoints;
    }

    if (questions !== undefined) {
      if (!Array.isArray(questions)) {
        return NextResponse.json({ 
          error: "questions must be an array",
          code: "INVALID_QUESTIONS_FORMAT" 
        }, { status: 400 });
      }

      // Validate each question has required fields
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i] as Question;
        if (!q.question || !Array.isArray(q.options) || typeof q.correct !== 'number' || typeof q.points !== 'number') {
          return NextResponse.json({ 
            error: `Invalid question format at index ${i}. Each question must have: question (string), options (array), correct (number), points (number)`,
            code: "INVALID_QUESTION_STRUCTURE" 
          }, { status: 400 });
        }
      }

      updates.questions = JSON.stringify(questions);
    }

    // Validate date range if both or either are provided
    let startsAtDate: Date | undefined;
    let endsAtDate: Date | undefined;

    if (startsAt !== undefined) {
      startsAtDate = new Date(startsAt);
      if (isNaN(startsAtDate.getTime())) {
        return NextResponse.json({ 
          error: "Invalid startsAt date format",
          code: "INVALID_STARTS_AT" 
        }, { status: 400 });
      }
      updates.startsAt = startsAtDate.toISOString();
    }

    if (endsAt !== undefined) {
      endsAtDate = new Date(endsAt);
      if (isNaN(endsAtDate.getTime())) {
        return NextResponse.json({ 
          error: "Invalid endsAt date format",
          code: "INVALID_ENDS_AT" 
        }, { status: 400 });
      }
      updates.endsAt = endsAtDate.toISOString();
    }

    // Validate date range
    const finalStartsAt = startsAtDate || new Date(existing[0].startsAt);
    const finalEndsAt = endsAtDate || new Date(existing[0].endsAt);

    if (finalStartsAt >= finalEndsAt) {
      return NextResponse.json({ 
        error: "startsAt must be before endsAt",
        code: "INVALID_DATE_RANGE" 
      }, { status: 400 });
    }

    // Perform update
    const updated = await db.update(quizzes)
      .set(updates)
      .where(eq(quizzes.id, quizId))
      .returning();

    // Parse questions for response
    const quizData = {
      ...updated[0],
      questions: typeof updated[0].questions === 'string' 
        ? JSON.parse(updated[0].questions) 
        : updated[0].questions
    };

    return NextResponse.json(quizData, { status: 200 });
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

    const quizId = parseInt(id);

    // Check if quiz exists
    const existing = await db.select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Quiz not found',
        code: "QUIZ_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete quiz
    const deleted = await db.delete(quizzes)
      .where(eq(quizzes.id, quizId))
      .returning();

    // Parse questions for response
    const quizData = {
      ...deleted[0],
      questions: typeof deleted[0].questions === 'string' 
        ? JSON.parse(deleted[0].questions) 
        : deleted[0].questions
    };

    return NextResponse.json({
      message: 'Quiz deleted successfully',
      quiz: quizData
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}