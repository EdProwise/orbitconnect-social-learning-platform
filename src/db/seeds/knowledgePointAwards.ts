import { db } from '@/db';
import { knowledgePointAwards } from '@/db/schema';

async function main() {
    const now = new Date();
    const sampleAwards = [
        // User 5 awards to different posts
        {
            postId: 1,
            awarderId: 5,
            points: 30,
            createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 1,
            awarderId: 5,
            points: 40,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 3,
            awarderId: 5,
            points: 50,
            createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 5,
            awarderId: 5,
            points: 20,
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        
        // User 6 awards to different posts
        {
            postId: 1,
            awarderId: 6,
            points: 20,
            createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 2,
            awarderId: 6,
            points: 40,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 4,
            awarderId: 6,
            points: 30,
            createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 6,
            awarderId: 6,
            points: 50,
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 8,
            awarderId: 6,
            points: 10,
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        
        // User 7 awards to different posts
        {
            postId: 2,
            awarderId: 7,
            points: 50,
            createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 3,
            awarderId: 7,
            points: 30,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 3,
            awarderId: 7,
            points: 20,
            createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 7,
            awarderId: 7,
            points: 40,
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 9,
            awarderId: 7,
            points: 30,
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        
        // User 8 awards to different posts
        {
            postId: 3,
            awarderId: 8,
            points: 30,
            createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 4,
            awarderId: 8,
            points: 20,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 5,
            awarderId: 8,
            points: 40,
            createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 10,
            awarderId: 8,
            points: 50,
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            postId: 6,
            awarderId: 8,
            points: 10,
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    await db.insert(knowledgePointAwards).values(sampleAwards);
    
    console.log('✅ Knowledge point awards seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});