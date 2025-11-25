import { db } from '@/db';
import { quizzes } from '@/db/schema';

async function main() {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const sampleQuizzes = [
        {
            title: 'JavaScript Fundamentals Quiz',
            description: 'Test your knowledge of JavaScript basics including variables, functions, and closures.',
            creatorId: 3,
            durationMinutes: 30,
            totalPoints: 100,
            questions: [
                {
                    question: 'What is a closure in JavaScript?',
                    options: ['A function', 'A variable scope', 'A function with access to outer scope', 'A loop'],
                    correct: 2,
                    points: 20
                },
                {
                    question: "What does 'typeof null' return?",
                    options: ['null', 'undefined', 'object', 'number'],
                    correct: 2,
                    points: 20
                },
                {
                    question: 'Which method adds elements to the end of an array?',
                    options: ['push()', 'pop()', 'shift()', 'unshift()'],
                    correct: 0,
                    points: 20
                },
                {
                    question: "What is the difference between '==' and '==='?",
                    options: ['No difference', '=== checks type and value', '== is faster', '=== is deprecated'],
                    correct: 1,
                    points: 20
                },
                {
                    question: "What does 'this' refer to in JavaScript?",
                    options: ['The window object', 'The current function', 'The execution context', 'The parent object'],
                    correct: 2,
                    points: 20
                }
            ],
            createdAt: tenDaysAgo.toISOString(),
            startsAt: fiveDaysAgo.toISOString(),
            endsAt: fiveDaysFromNow.toISOString(),
        }
    ];

    await db.insert(quizzes).values(sampleQuizzes);
    
    console.log('✅ Quizzes seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});