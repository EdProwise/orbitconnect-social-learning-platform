import { db } from '@/db';
import { connections } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const sampleConnections = [
        {
            requesterId: 5,
            receiverId: 2,
            status: 'ACCEPTED',
            createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            requesterId: 6,
            receiverId: 3,
            status: 'ACCEPTED',
            createdAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            requesterId: 7,
            receiverId: 4,
            status: 'ACCEPTED',
            createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            requesterId: 8,
            receiverId: 2,
            status: 'ACCEPTED',
            createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            requesterId: 5,
            receiverId: 6,
            status: 'ACCEPTED',
            createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 24 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            requesterId: 7,
            receiverId: 5,
            status: 'ACCEPTED',
            createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            requesterId: 6,
            receiverId: 8,
            status: 'ACCEPTED',
            createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            requesterId: 3,
            receiverId: 2,
            status: 'ACCEPTED',
            createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    await db.insert(connections).values(sampleConnections);
    
    console.log('✅ Connections seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});