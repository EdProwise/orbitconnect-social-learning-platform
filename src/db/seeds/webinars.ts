import { db } from '@/db';
import { webinars } from '@/db/schema';

async function main() {
    const now = new Date();
    const scheduledAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const createdAt = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const sampleWebinars = [
        {
            title: 'Career Guidance for Tech Students',
            description: 'Explore career paths in technology, learn about industry trends, and get advice on building your professional portfolio.',
            hostId: 2,
            thumbnail: 'https://picsum.photos/seed/webinar-career/800/450',
            meetingLink: 'https://zoom.us/j/123456789',
            scheduledAt: scheduledAt.toISOString(),
            durationMinutes: 90,
            maxParticipants: 50,
            registeredCount: 23,
            createdAt: createdAt.toISOString(),
        }
    ];

    await db.insert(webinars).values(sampleWebinars);
    
    console.log('✅ Webinars seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});