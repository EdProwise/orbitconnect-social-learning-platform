import { db } from '@/db';
import { mentorships } from '@/db/schema';

async function main() {
    const sampleMentorships = [
        {
            mentorId: 2,
            expertise: ["Web Development", "Artificial Intelligence", "Career Guidance"],
            availability: {
                monday: "14:00-17:00",
                wednesday: "14:00-17:00",
                friday: "15:00-18:00"
            },
            hourlyRate: 45.00,
            rating: 4.8,
            totalSessions: 34,
            bio: "Experienced educator with 8 years in tech industry. Passionate about helping students transition into software engineering careers."
        },
        {
            mentorId: 3,
            expertise: ["Programming", "Career Development", "Technical Interviews"],
            availability: {
                tuesday: "16:00-19:00",
                thursday: "16:00-19:00"
            },
            hourlyRate: 50.00,
            rating: 4.9,
            totalSessions: 47,
            bio: "Former software engineer at Google. Specialized in helping students ace technical interviews and land their dream jobs."
        },
        {
            mentorId: 4,
            expertise: ["Science", "Research Methods", "Academic Writing"],
            availability: {
                monday: "13:00-16:00",
                wednesday: "13:00-16:00",
                saturday: "10:00-14:00"
            },
            hourlyRate: 40.00,
            rating: 4.7,
            totalSessions: 28,
            bio: "PhD in Chemistry with research experience. Help students with science projects, lab techniques, and research paper writing."
        }
    ];

    await db.insert(mentorships).values(sampleMentorships);
    
    console.log('✅ Mentorships seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});