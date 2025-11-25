import { db } from '@/db';
import { comments } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const sampleComments = [
        {
            postId: 1,
            userId: 5,
            parentCommentId: null,
            content: "Great tips! The dedicated study space really helped me improve my focus.",
            createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 1,
            userId: 6,
            parentCommentId: null,
            content: "I struggle with #2. Any advice on maintaining a consistent schedule?",
            createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 3,
            userId: 2,
            parentCommentId: null,
            content: "Emma, use the quadratic formula when you can't factor easily. Look for perfect squares first!",
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 4,
            userId: 8,
            parentCommentId: null,
            content: "Congratulations James! Your hard work paid off! 🎉",
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 5,
            userId: 5,
            parentCommentId: null,
            content: "I vote Python! It's beginner-friendly and versatile.",
            createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 6,
            userId: 6,
            parentCommentId: null,
            content: "Thank you for sharing! These notes are super helpful for my exam prep.",
            createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 7,
            userId: 7,
            parentCommentId: null,
            content: "Do you still have the English textbook? I could really use it!",
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 8,
            userId: 5,
            parentCommentId: null,
            content: "This is a great introduction! Could you recommend some beginner ML projects?",
            createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 9,
            userId: 2,
            parentCommentId: null,
            content: "Khan Academy and College Board's official practice tests are excellent resources!",
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 10,
            userId: 8,
            parentCommentId: null,
            content: "Welcome to the club Emma! Can't wait to work on projects together!",
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 1,
            userId: 2,
            parentCommentId: 2,
            content: "Try using a planner and set specific time blocks for each subject. Consistency is key!",
            createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 3,
            userId: 6,
            parentCommentId: 3,
            content: "Thanks! That makes sense. I'll practice identifying perfect squares first.",
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 7,
            userId: 8,
            parentCommentId: 7,
            content: "Yes! I'll bring it to school tomorrow. Meet me at the library?",
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 8,
            userId: 3,
            parentCommentId: 8,
            content: "Start with image classification using MNIST dataset or build a simple spam filter!",
            createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 9,
            userId: 5,
            parentCommentId: 9,
            content: "Thanks! I'll check those out. How many practice tests would you recommend?",
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    await db.insert(comments).values(sampleComments);
    
    console.log('✅ Comments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});