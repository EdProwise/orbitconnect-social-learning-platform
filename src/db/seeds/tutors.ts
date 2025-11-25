import { db } from '@/db';
import { tutors } from '@/db/schema';

async function main() {
    const sampleTutors = [
        {
            tutorId: 2,
            subjects: ["Mathematics", "Physics", "Computer Science"],
            experienceYears: 8,
            hourlyRate: 35.00,
            rating: 4.7,
            totalStudents: 52,
            bio: "Patient tutor specializing in STEM subjects. Help students build strong foundations in math and science.",
        },
        {
            tutorId: 3,
            subjects: ["Programming", "Computer Science", "Data Structures"],
            experienceYears: 10,
            hourlyRate: 40.00,
            rating: 4.9,
            totalStudents: 68,
            bio: "Professional programmer with industry experience. Make coding fun and accessible for all skill levels.",
        }
    ];

    await db.insert(tutors).values(sampleTutors);
    
    console.log('✅ Tutors seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});