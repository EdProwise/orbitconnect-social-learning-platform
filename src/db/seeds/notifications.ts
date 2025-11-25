import { db } from '@/db';
import { notifications } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const getDateDaysAgo = (days: number): string => {
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        return date.toISOString();
    };

    const sampleNotifications = [
        {
            userId: 2,
            type: 'COMMENT',
            title: 'New Comment',
            message: "Alex Kumar commented on your post '5 Tips for Effective Online Learning'",
            link: '/posts/1',
            readAt: getDateDaysAgo(4),
            createdAt: getDateDaysAgo(4),
        },
        {
            userId: 5,
            type: 'CONNECTION',
            title: 'Connection Accepted',
            message: 'Sarah Johnson accepted your connection request',
            link: '/profile/2',
            readAt: getDateDaysAgo(18),
            createdAt: getDateDaysAgo(18),
        },
        {
            userId: 2,
            type: 'ENROLLMENT',
            title: 'New Student Enrolled',
            message: "Alex Kumar enrolled in your course 'Intro to Python'",
            link: '/courses/1',
            readAt: getDateDaysAgo(24),
            createdAt: getDateDaysAgo(25),
        },
        {
            userId: 5,
            type: 'REACTION',
            title: 'New Reaction',
            message: "Sarah Johnson loved your post 'Our Science Fair Project'",
            link: '/posts/2',
            readAt: getDateDaysAgo(3),
            createdAt: getDateDaysAgo(4),
        },
        {
            userId: 6,
            type: 'COMMENT',
            title: 'New Comment',
            message: "Sarah Johnson commented on your post 'How do I solve quadratic equations?'",
            link: '/posts/3',
            readAt: getDateDaysAgo(3),
            createdAt: getDateDaysAgo(3),
        },
        {
            userId: 3,
            type: 'MESSAGE',
            title: 'New Message',
            message: 'Emma Wilson sent you a message',
            link: '/messages',
            readAt: getDateDaysAgo(5),
            createdAt: getDateDaysAgo(6),
        },
        {
            userId: 4,
            type: 'CONNECTION',
            title: 'New Connection Request',
            message: 'James Lee wants to connect with you',
            link: '/connections',
            readAt: null,
            createdAt: getDateDaysAgo(15),
        },
        {
            userId: 3,
            type: 'ENROLLMENT',
            title: 'Course Completed',
            message: "Emma Wilson completed your course 'Web Development Bootcamp'",
            link: '/courses/2',
            readAt: getDateDaysAgo(5),
            createdAt: getDateDaysAgo(5),
        },
        {
            userId: 7,
            type: 'REACTION',
            title: 'New Reactions',
            message: "3 people reacted to your post 'Just won the Regional Debate Championship!'",
            link: '/posts/4',
            readAt: getDateDaysAgo(2),
            createdAt: getDateDaysAgo(2),
        },
        {
            userId: 8,
            type: 'COMMENT',
            title: 'New Comment',
            message: "James Lee commented on your post 'Donating my Grade 10 textbooks'",
            link: '/posts/7',
            readAt: null,
            createdAt: getDateDaysAgo(1),
        },
    ];

    await db.insert(notifications).values(sampleNotifications);
    
    console.log('✅ Notifications seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});