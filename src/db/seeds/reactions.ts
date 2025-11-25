import { db } from '@/db';
import { reactions } from '@/db/schema';

async function main() {
    const sampleReactions = [
        {
            userId: 5,
            postId: 1,
            commentId: null,
            type: 'LIKE',
            createdAt: new Date('2024-01-15T10:30:00').toISOString(),
        },
        {
            userId: 6,
            postId: 1,
            commentId: null,
            type: 'INSIGHTFUL',
            createdAt: new Date('2024-01-15T11:15:00').toISOString(),
        },
        {
            userId: 8,
            postId: 1,
            commentId: null,
            type: 'LOVE',
            createdAt: new Date('2024-01-15T14:20:00').toISOString(),
        },
        {
            userId: 2,
            postId: 2,
            commentId: null,
            type: 'LIKE',
            createdAt: new Date('2024-01-16T09:45:00').toISOString(),
        },
        {
            userId: 6,
            postId: 2,
            commentId: null,
            type: 'LOVE',
            createdAt: new Date('2024-01-16T13:30:00').toISOString(),
        },
        {
            userId: 2,
            postId: 3,
            commentId: null,
            type: 'SUPPORT',
            createdAt: new Date('2024-01-17T10:00:00').toISOString(),
        },
        {
            userId: 5,
            postId: 3,
            commentId: null,
            type: 'LIKE',
            createdAt: new Date('2024-01-17T15:45:00').toISOString(),
        },
        {
            userId: 8,
            postId: 4,
            commentId: null,
            type: 'LOVE',
            createdAt: new Date('2024-01-18T08:30:00').toISOString(),
        },
        {
            userId: 6,
            postId: 4,
            commentId: null,
            type: 'SUPPORT',
            createdAt: new Date('2024-01-18T11:20:00').toISOString(),
        },
        {
            userId: 5,
            postId: 4,
            commentId: null,
            type: 'LIKE',
            createdAt: new Date('2024-01-18T16:10:00').toISOString(),
        },
        {
            userId: 5,
            postId: 5,
            commentId: null,
            type: 'INSIGHTFUL',
            createdAt: new Date('2024-01-19T09:15:00').toISOString(),
        },
        {
            userId: 6,
            postId: 5,
            commentId: null,
            type: 'LIKE',
            createdAt: new Date('2024-01-19T14:40:00').toISOString(),
        },
        {
            userId: 6,
            postId: 6,
            commentId: null,
            type: 'INSIGHTFUL',
            createdAt: new Date('2024-01-20T10:25:00').toISOString(),
        },
        {
            userId: 5,
            postId: 6,
            commentId: null,
            type: 'LIKE',
            createdAt: new Date('2024-01-20T12:50:00').toISOString(),
        },
        {
            userId: 7,
            postId: 7,
            commentId: null,
            type: 'SUPPORT',
            createdAt: new Date('2024-01-21T11:30:00').toISOString(),
        },
        {
            userId: 5,
            postId: 8,
            commentId: null,
            type: 'INSIGHTFUL',
            createdAt: new Date('2024-01-22T09:20:00').toISOString(),
        },
        {
            userId: 8,
            postId: 8,
            commentId: null,
            type: 'LIKE',
            createdAt: new Date('2024-01-22T13:45:00').toISOString(),
        },
        {
            userId: 2,
            postId: 9,
            commentId: null,
            type: 'SUPPORT',
            createdAt: new Date('2024-01-23T10:10:00').toISOString(),
        },
        {
            userId: 6,
            postId: 9,
            commentId: null,
            type: 'LIKE',
            createdAt: new Date('2024-01-23T15:30:00').toISOString(),
        },
        {
            userId: 8,
            postId: 10,
            commentId: null,
            type: 'LOVE',
            createdAt: new Date('2024-01-24T11:00:00').toISOString(),
        },
    ];

    await db.insert(reactions).values(sampleReactions);
    
    console.log('✅ Reactions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});