import { db } from '@/db';
import { schools } from '@/db/schema';

async function main() {
    const sampleSchools = [
        {
            slug: 'greenwood-academy',
            name: 'Greenwood Academy',
            description: 'A prestigious institution fostering excellence in education since 1995.',
            location: 'New York, NY',
            website: 'https://greenwood-academy.edu',
            logo: 'https://picsum.photos/seed/greenwood/200',
            coverImage: 'https://picsum.photos/seed/greenwood-cover/1200/400',
            establishedYear: 1995,
            studentCount: 850,
            teacherCount: 45,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            slug: 'riverside-high',
            name: 'Riverside High School',
            description: 'Excellence in academics and sports for over two decades.',
            location: 'Austin, TX',
            website: 'https://riverside-high.edu',
            logo: 'https://picsum.photos/seed/riverside/200',
            coverImage: 'https://picsum.photos/seed/riverside-cover/1200/400',
            establishedYear: 2001,
            studentCount: 1200,
            teacherCount: 68,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            slug: 'summit-international',
            name: 'Summit International School',
            description: 'A modern learning hub with international curriculum and diverse community.',
            location: 'San Francisco, CA',
            website: 'https://summit-international.edu',
            logo: 'https://picsum.photos/seed/summit/200',
            coverImage: 'https://picsum.photos/seed/summit-cover/1200/400',
            establishedYear: 2010,
            studentCount: 680,
            teacherCount: 52,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(schools).values(sampleSchools);
    
    console.log('✅ Schools seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});