import { db } from '@/db';
import { courseEnrollments } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const calculateDate = (daysAgo: number): string => {
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString();
    };

    const sampleEnrollments = [
        {
            courseId: 1,
            userId: 5,
            progressPercent: 65,
            completedAt: null,
            enrolledAt: calculateDate(25),
            lastAccessed: calculateDate(1),
        },
        {
            courseId: 2,
            userId: 6,
            progressPercent: 100,
            completedAt: calculateDate(5),
            enrolledAt: calculateDate(20),
            lastAccessed: calculateDate(5),
        },
        {
            courseId: 3,
            userId: 7,
            progressPercent: 40,
            completedAt: null,
            enrolledAt: calculateDate(15),
            lastAccessed: calculateDate(2),
        },
        {
            courseId: 5,
            userId: 8,
            progressPercent: 80,
            completedAt: null,
            enrolledAt: calculateDate(12),
            lastAccessed: calculateDate(1),
        },
        {
            courseId: 6,
            userId: 5,
            progressPercent: 25,
            completedAt: null,
            enrolledAt: calculateDate(10),
            lastAccessed: calculateDate(3),
        },
    ];

    await db.insert(courseEnrollments).values(sampleEnrollments);
    
    console.log('✅ Course enrollments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});