import { db } from '@/db';
import { messages } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const getDateDaysAgo = (days: number): string => {
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        return date.toISOString();
    };

    const sampleMessages = [
        {
            senderId: 5,
            receiverId: 2,
            content: "Hi Professor Johnson! I have a question about the Python course assignment.",
            readAt: getDateDaysAgo(19),
            createdAt: getDateDaysAgo(20),
        },
        {
            senderId: 2,
            receiverId: 5,
            content: "Of course! What do you need help with?",
            readAt: getDateDaysAgo(19),
            createdAt: getDateDaysAgo(19),
        },
        {
            senderId: 6,
            receiverId: 3,
            content: "Thank you for the great lecture today on JavaScript closures!",
            readAt: getDateDaysAgo(5),
            createdAt: getDateDaysAgo(6),
        },
        {
            senderId: 3,
            receiverId: 6,
            content: "You're welcome! Keep practicing and you'll master it in no time.",
            readAt: getDateDaysAgo(5),
            createdAt: getDateDaysAgo(5),
        },
        {
            senderId: 7,
            receiverId: 4,
            content: "Could I schedule a time to discuss my chemistry research project?",
            readAt: getDateDaysAgo(10),
            createdAt: getDateDaysAgo(11),
        },
        {
            senderId: 4,
            receiverId: 7,
            content: "Sure! How about Wednesday at 3 PM in the science lab?",
            readAt: getDateDaysAgo(10),
            createdAt: getDateDaysAgo(10),
        },
        {
            senderId: 8,
            receiverId: 2,
            content: "I really enjoyed your article on online learning tips!",
            readAt: getDateDaysAgo(4),
            createdAt: getDateDaysAgo(5),
        },
        {
            senderId: 5,
            receiverId: 6,
            content: "Hey! Want to work on the physics lab report together?",
            readAt: getDateDaysAgo(8),
            createdAt: getDateDaysAgo(9),
        },
        {
            senderId: 6,
            receiverId: 5,
            content: "Sounds good! Meet at the library tomorrow?",
            readAt: getDateDaysAgo(8),
            createdAt: getDateDaysAgo(8),
        },
        {
            senderId: 7,
            receiverId: 5,
            content: "Congratulations on your science fair project! Really impressive work.",
            readAt: getDateDaysAgo(3),
            createdAt: getDateDaysAgo(4),
        },
        {
            senderId: 6,
            receiverId: 8,
            content: "Are you still donating those textbooks? I know someone who needs them.",
            readAt: getDateDaysAgo(1),
            createdAt: getDateDaysAgo(2),
        },
        {
            senderId: 3,
            receiverId: 2,
            content: "Let's collaborate on that machine learning workshop next month!",
            readAt: getDateDaysAgo(15),
            createdAt: getDateDaysAgo(16),
        }
    ];

    await db.insert(messages).values(sampleMessages);
    
    console.log('✅ Messages seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});