import { db } from '@/db';
import { savedPosts } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const sampleSavedPosts = [
        {
            userId: 5,
            postId: 1,
            createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: 6,
            postId: 6,
            createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: 8,
            postId: 8,
            createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
    ];

    await db.insert(savedPosts).values(sampleSavedPosts);
    
    console.log('✅ Saved posts seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});