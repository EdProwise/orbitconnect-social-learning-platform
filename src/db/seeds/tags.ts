import { db } from '@/db';
import { tags } from '@/db/schema';

async function main() {
    const sampleTags = [
        {
            name: 'Machine Learning',
            trendingScore: 45,
            createdAt: new Date('2024-12-01').toISOString(),
        },
        {
            name: 'Web Development',
            trendingScore: 48,
            createdAt: new Date('2024-12-03').toISOString(),
        },
        {
            name: 'Python Programming',
            trendingScore: 42,
            createdAt: new Date('2024-12-05').toISOString(),
        },
        {
            name: 'Data Science',
            trendingScore: 38,
            createdAt: new Date('2024-12-07').toISOString(),
        },
        {
            name: 'Career Guidance',
            trendingScore: 25,
            createdAt: new Date('2024-12-10').toISOString(),
        },
        {
            name: 'Study Tips',
            trendingScore: 28,
            createdAt: new Date('2024-12-12').toISOString(),
        },
        {
            name: 'Mathematics',
            trendingScore: 22,
            createdAt: new Date('2024-12-15').toISOString(),
        },
        {
            name: 'Physics',
            trendingScore: 18,
            createdAt: new Date('2024-12-18').toISOString(),
        },
        {
            name: 'Chemistry',
            trendingScore: 15,
            createdAt: new Date('2024-12-20').toISOString(),
        },
        {
            name: 'Debate Skills',
            trendingScore: 12,
            createdAt: new Date('2024-12-23').toISOString(),
        }
    ];

    await db.insert(tags).values(sampleTags);
    
    console.log('✅ Tags seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});