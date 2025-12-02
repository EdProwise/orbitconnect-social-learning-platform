import { sqliteTable, integer, text, real, index } from 'drizzle-orm/sqlite-core';

// Schools table
export const schools = sqliteTable('schools', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  coverImage: text('cover_image'),
  description: text('description'),
  location: text('location'),
  website: text('website'),
  studentCount: integer('student_count').notNull().default(0),
  teacherCount: integer('teacher_count').notNull().default(0),
  establishedYear: integer('established_year'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  coverImage: text('cover_image'),
  role: text('role').notNull(), // 'STUDENT'|'TEACHER'|'SCHOOL'|'ADMIN'
  bio: text('bio'),
  schoolId: integer('school_id').references(() => schools.id),
  currentTown: text('current_town'),
  phone: text('phone'),
  socialMediaLinks: text('social_media_links', { mode: 'json' }),
  class: text('class'),
  schoolHistory: text('school_history', { mode: 'json' }),
  aboutYourself: text('about_yourself'),
  teachingExperience: text('teaching_experience', { mode: 'json' }),
  skills: text('skills', { mode: 'json' }),
  teachingSubjects: text('teaching_subjects', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Posts table
export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  schoolId: integer('school_id').references(() => schools.id),
  type: text('type').notNull(), // 'ARTICLE'|'PHOTO_VIDEO'|'QUESTION'|'CELEBRATE'|'POLL'|'STUDY_MATERIAL'|'DONATE_BOOKS'
  title: text('title').notNull(),
  content: text('content'),
  mediaUrls: text('media_urls', { mode: 'json' }),
  pollOptions: text('poll_options', { mode: 'json' }),
  fileUrls: text('file_urls', { mode: 'json' }),
  viewCount: integer('view_count').notNull().default(0),
  knowledgePoints: integer('knowledge_points').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Comments table
export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').notNull().references(() => posts.id),
  userId: integer('user_id').notNull().references(() => users.id),
  parentCommentId: integer('parent_comment_id').references(() => comments.id),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Reactions table
export const reactions = sqliteTable('reactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').references(() => posts.id),
  commentId: integer('comment_id').references(() => comments.id),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // 'LIKE'|'LOVE'|'INSIGHTFUL'|'SUPPORT'
  createdAt: text('created_at').notNull(),
}, (table) => ({
  userPostTypeIdx: index('user_post_type_idx').on(table.userId, table.postId, table.type),
  userCommentTypeIdx: index('user_comment_type_idx').on(table.userId, table.commentId, table.type),
}));

// Courses table
export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  instructorId: integer('instructor_id').notNull().references(() => users.id),
  schoolId: integer('school_id').references(() => schools.id),
  category: text('category').notNull(),
  thumbnail: text('thumbnail'),
  videoUrl: text('video_url'),
  durationHours: integer('duration_hours'),
  level: text('level').notNull(), // 'BEGINNER'|'INTERMEDIATE'|'ADVANCED'
  price: real('price').notNull(),
  enrolledCount: integer('enrolled_count').notNull().default(0),
  rating: real('rating').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Course Enrollments table
export const courseEnrollments = sqliteTable('course_enrollments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id').notNull().references(() => courses.id),
  userId: integer('user_id').notNull().references(() => users.id),
  progressPercent: integer('progress_percent').notNull().default(0),
  completedAt: text('completed_at'),
  enrolledAt: text('enrolled_at').notNull(),
  lastAccessed: text('last_accessed').notNull(),
}, (table) => ({
  courseUserIdx: index('course_user_idx').on(table.courseId, table.userId),
}));

// Quizzes table
export const quizzes = sqliteTable('quizzes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  creatorId: integer('creator_id').notNull().references(() => users.id),
  durationMinutes: integer('duration_minutes').notNull(),
  totalPoints: integer('total_points').notNull(),
  questions: text('questions', { mode: 'json' }).notNull(),
  createdAt: text('created_at').notNull(),
  startsAt: text('starts_at').notNull(),
  endsAt: text('ends_at').notNull(),
});

// Webinars table
export const webinars = sqliteTable('webinars', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  hostId: integer('host_id').notNull().references(() => users.id),
  thumbnail: text('thumbnail'),
  meetingLink: text('meeting_link').notNull(),
  scheduledAt: text('scheduled_at').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  maxParticipants: integer('max_participants').notNull(),
  registeredCount: integer('registered_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

// Debates table
export const debates = sqliteTable('debates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  topic: text('topic').notNull(),
  organizerId: integer('organizer_id').notNull().references(() => users.id),
  format: text('format').notNull(),
  scheduledAt: text('scheduled_at').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  teamAMembers: text('team_a_members', { mode: 'json' }),
  teamBMembers: text('team_b_members', { mode: 'json' }),
  status: text('status').notNull(), // 'UPCOMING'|'LIVE'|'COMPLETED'
  createdAt: text('created_at').notNull(),
});

// Messages table
export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  senderId: integer('sender_id').notNull().references(() => users.id),
  receiverId: integer('receiver_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  readAt: text('read_at'),
  createdAt: text('created_at').notNull(),
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  readAt: text('read_at'),
  createdAt: text('created_at').notNull(),
});

// Connections table
export const connections = sqliteTable('connections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  requesterId: integer('requester_id').notNull().references(() => users.id),
  receiverId: integer('receiver_id').notNull().references(() => users.id),
  status: text('status').notNull(), // 'PENDING'|'ACCEPTED'|'REJECTED'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  requesterReceiverIdx: index('requester_receiver_idx').on(table.requesterId, table.receiverId),
}));

// Saved Posts table
export const savedPosts = sqliteTable('saved_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  postId: integer('post_id').notNull().references(() => posts.id),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  userPostIdx: index('user_post_idx').on(table.userId, table.postId),
}));

// Mentorships table
export const mentorships = sqliteTable('mentorships', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  mentorId: integer('mentor_id').notNull().references(() => users.id),
  expertise: text('expertise', { mode: 'json' }).notNull(),
  availability: text('availability', { mode: 'json' }),
  hourlyRate: real('hourly_rate').notNull(),
  rating: real('rating').notNull().default(0),
  totalSessions: integer('total_sessions').notNull().default(0),
  bio: text('bio'),
});

// Tutors table
export const tutors = sqliteTable('tutors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tutorId: integer('tutor_id').notNull().references(() => users.id),
  subjects: text('subjects', { mode: 'json' }).notNull(),
  experienceYears: integer('experience_years').notNull(),
  hourlyRate: real('hourly_rate').notNull(),
  rating: real('rating').notNull().default(0),
  totalStudents: integer('total_students').notNull().default(0),
  bio: text('bio'),
});

// Tags table
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  trendingScore: integer('trending_score').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

// Post Tags table (many-to-many relationship)
export const postTags = sqliteTable('post_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').notNull().references(() => posts.id),
  tagId: integer('tag_id').notNull().references(() => tags.id),
}, (table) => ({
  postTagIdx: index('post_tag_idx').on(table.postId, table.tagId),
}));

// Knowledge Point Awards table
export const knowledgePointAwards = sqliteTable('knowledge_point_awards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').notNull().references(() => posts.id),
  awarderId: integer('awarder_id').notNull().references(() => users.id),
  points: integer('points').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  postAwarderIdx: index('post_awarder_idx').on(table.postId, table.awarderId),
}));

// Follows table
export const follows = sqliteTable('follows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  followerId: integer('follower_id').notNull().references(() => users.id),
  followingId: integer('following_id').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  followerFollowingIdx: index('follower_following_idx').on(table.followerId, table.followingId),
}));