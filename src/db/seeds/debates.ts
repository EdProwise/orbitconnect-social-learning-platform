import { db } from '@/db';
import { debates } from '@/db/schema';

async function main() {
    const now = new Date();
    const scheduledAt = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const createdAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const sampleDebates = [
        {
            title: 'Technology in Education: Boon or Bane',
            topic: 'Is technology in classrooms helping or hindering student learning? Debate the pros and cons of digital education.',
            organizerId: 7,
            format: 'Oxford Style Debate',
            scheduledAt: scheduledAt.toISOString(),
            durationMinutes: 120,
            teamAMembers: ['Alex Kumar', 'Emma Wilson'],
            teamBMembers: ['Sophia Garcia', 'Michael Chen'],
            status: 'UPCOMING',
            createdAt: createdAt.toISOString(),
        }
    ];

    await db.insert(debates).values(sampleDebates);
    
    console.log('✅ Debates seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});