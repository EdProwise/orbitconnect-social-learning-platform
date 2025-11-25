import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            email: 'admin@orbitconnect.com',
            passwordHash: '$2a$10$dummyhashforadmin1234567890',
            name: 'Admin User',
            role: 'ADMIN',
            bio: 'Platform administrator',
            avatar: 'https://i.pravatar.cc/150?u=admin',
            schoolId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            email: 'sarah.johnson@greenwood.edu',
            passwordHash: '$2a$10$dummyhashforteacher123456789',
            name: 'Sarah Johnson',
            role: 'TEACHER',
            bio: 'Computer Science teacher passionate about technology education',
            avatar: 'https://i.pravatar.cc/150?u=sarah',
            schoolId: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            email: 'michael.chen@riverside.edu',
            passwordHash: '$2a$10$dummyhashforteacher123456789',
            name: 'Michael Chen',
            role: 'TEACHER',
            bio: 'Programming instructor with 10 years of industry experience',
            avatar: 'https://i.pravatar.cc/150?u=michael',
            schoolId: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            email: 'priya.sharma@summit.edu',
            passwordHash: '$2a$10$dummyhashforteacher123456789',
            name: 'Priya Sharma',
            role: 'TEACHER',
            bio: 'Science educator specializing in Chemistry and Physics',
            avatar: 'https://i.pravatar.cc/150?u=priya',
            schoolId: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            email: 'alex.kumar@student.com',
            passwordHash: '$2a$10$dummyhashforstudent1234567890',
            name: 'Alex Kumar',
            role: 'STUDENT',
            bio: 'Science enthusiast and aspiring engineer',
            avatar: 'https://i.pravatar.cc/150?u=alex',
            schoolId: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            email: 'emma.wilson@student.com',
            passwordHash: '$2a$10$dummyhashforstudent1234567890',
            name: 'Emma Wilson',
            role: 'STUDENT',
            bio: 'Math lover and debate club member',
            avatar: 'https://i.pravatar.cc/150?u=emma',
            schoolId: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            email: 'james.lee@student.com',
            passwordHash: '$2a$10$dummyhashforstudent1234567890',
            name: 'James Lee',
            role: 'STUDENT',
            bio: 'Debate champion and public speaking advocate',
            avatar: 'https://i.pravatar.cc/150?u=james',
            schoolId: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            email: 'sophia.garcia@student.com',
            passwordHash: '$2a$10$dummyhashforstudent1234567890',
            name: 'Sophia Garcia',
            role: 'STUDENT',
            bio: 'Book lover and community volunteer',
            avatar: 'https://i.pravatar.cc/150?u=sophia',
            schoolId: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});