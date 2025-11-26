import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { knowledgePointAwards, posts, users } from '@/db/schema';
import { eq, and, sum, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');
    const awarderId = searchParams.get('awarderId');

    // Validate postId is provided and valid
    if (!postId || isNaN(parseInt(postId))) {
      return NextResponse.json({
        error: "Valid postId is required",
        code: "INVALID_POST_ID"
      }, { status: 400 });
    }

    const postIdNum = parseInt(postId);

    // Check if post exists
    const postRecord = await db.select()
      .from(posts)
      .where(eq(posts.id, postIdNum))
      .limit(1);

    if (postRecord.length === 0) {
      return NextResponse.json({
        error: "Post not found",
        code: "POST_NOT_FOUND"
      }, { status: 404 });
    }

    // If awarderId is provided, return user-specific data
    if (awarderId) {
      if (isNaN(parseInt(awarderId))) {
        return NextResponse.json({
          error: "Valid awarderId is required",
          code: "INVALID_AWARDER_ID"
        }, { status: 400 });
      }

      const awarderIdNum = parseInt(awarderId);

      // Get only awards from this specific user to this post
      const userAwards = await db.select()
        .from(knowledgePointAwards)
        .where(
          and(
            eq(knowledgePointAwards.postId, postIdNum),
            eq(knowledgePointAwards.awarderId, awarderIdNum)
          )
        )
        .orderBy(desc(knowledgePointAwards.createdAt));

      // Calculate total points awarded by this user
      const totalPointsAwarded = userAwards.reduce((sum, award) => sum + award.points, 0);
      const remainingPoints = 100 - totalPointsAwarded;

      return NextResponse.json({
        postId: postIdNum,
        awarderId: awarderIdNum,
        totalPointsAwarded,
        remainingPoints,
        awards: userAwards.map(award => ({
          id: award.id,
          points: award.points,
          createdAt: award.createdAt
        }))
      }, { status: 200 });
    }

    // If only postId provided, return all awards for the post
    const allAwards = await db.select()
      .from(knowledgePointAwards)
      .where(eq(knowledgePointAwards.postId, postIdNum))
      .orderBy(desc(knowledgePointAwards.createdAt));

    const postTotalPoints = allAwards.reduce((sum, award) => sum + award.points, 0);

    return NextResponse.json({
      postId: postIdNum,
      postTotalPoints,
      totalAwards: allAwards.length,
      awards: allAwards.map(award => ({
        id: award.id,
        awarderId: award.awarderId,
        points: award.points,
        createdAt: award.createdAt
      }))
    }, { status: 200 });

  } catch (error) {
    console.error('GET knowledge-points error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, awarderId, points } = body;

    // Validate required fields
    if (!postId) {
      return NextResponse.json({
        error: "postId is required",
        code: "MISSING_POST_ID"
      }, { status: 400 });
    }

    if (!awarderId) {
      return NextResponse.json({
        error: "awarderId is required",
        code: "MISSING_AWARDER_ID"
      }, { status: 400 });
    }

    if (points === undefined || points === null) {
      return NextResponse.json({
        error: "points is required",
        code: "MISSING_POINTS"
      }, { status: 400 });
    }

    // Validate all are integers
    if (isNaN(parseInt(String(postId))) || isNaN(parseInt(String(awarderId))) || isNaN(parseInt(String(points)))) {
      return NextResponse.json({
        error: "postId, awarderId, and points must be valid integers",
        code: "INVALID_PARAMETERS"
      }, { status: 400 });
    }

    const postIdNum = parseInt(String(postId));
    const awarderIdNum = parseInt(String(awarderId));
    const pointsNum = parseInt(String(points));

    // Validate points are multiples of 10 between 10-100
    if (pointsNum < 10 || pointsNum > 100 || pointsNum % 10 !== 0) {
      return NextResponse.json({
        error: "Points must be multiples of 10 between 10 and 100",
        code: "INVALID_POINTS"
      }, { status: 400 });
    }

    // Check if user exists
    const userRecord = await db.select()
      .from(users)
      .where(eq(users.id, awarderIdNum))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({
        error: "User not found",
        code: "USER_NOT_FOUND"
      }, { status: 400 });
    }

    // Check if post exists
    const postRecord = await db.select()
      .from(posts)
      .where(eq(posts.id, postIdNum))
      .limit(1);

    if (postRecord.length === 0) {
      return NextResponse.json({
        error: "Post not found",
        code: "POST_NOT_FOUND"
      }, { status: 400 });
    }

    const post = postRecord[0];

    // Check if user is trying to award points to their own post
    if (post.userId === awarderIdNum) {
      return NextResponse.json({
        error: "You cannot award points to your own post",
        code: "SELF_AWARD_NOT_ALLOWED"
      }, { status: 400 });
    }

    // Get all previous awards from this user to this post
    const previousAwards = await db.select()
      .from(knowledgePointAwards)
      .where(
        and(
          eq(knowledgePointAwards.postId, postIdNum),
          eq(knowledgePointAwards.awarderId, awarderIdNum)
        )
      );

    const totalPreviousPoints = previousAwards.reduce((sum, award) => sum + award.points, 0);
    const newTotal = totalPreviousPoints + pointsNum;

    // Check if total would exceed 100 points
    if (newTotal > 100) {
      return NextResponse.json({
        error: `You have already awarded ${totalPreviousPoints} points to this post. Maximum is 100 points per user per post`,
        code: "POINTS_LIMIT_EXCEEDED"
      }, { status: 400 });
    }

    // Insert new award
    const newAward = await db.insert(knowledgePointAwards)
      .values({
        postId: postIdNum,
        awarderId: awarderIdNum,
        points: pointsNum,
        createdAt: new Date().toISOString()
      })
      .returning();

    // Update post's total knowledge points
    const updatedPost = await db.update(posts)
      .set({
        knowledgePoints: sql`${posts.knowledgePoints} + ${pointsNum}`,
        updatedAt: new Date().toISOString()
      })
      .where(eq(posts.id, postIdNum))
      .returning();

    return NextResponse.json({
      success: true,
      award: {
        id: newAward[0].id,
        postId: newAward[0].postId,
        awarderId: newAward[0].awarderId,
        points: newAward[0].points,
        createdAt: newAward[0].createdAt
      },
      totalPointsAwarded: newTotal,
      remainingPoints: 100 - newTotal,
      postTotalPoints: updatedPost[0].knowledgePoints
    }, { status: 201 });

  } catch (error) {
    console.error('POST knowledge-points error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}