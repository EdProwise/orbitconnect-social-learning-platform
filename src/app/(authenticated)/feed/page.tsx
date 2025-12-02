'use client';

import { useState, useEffect } from 'react';
import { PostComposer } from '@/components/feed/post-composer';
import { PostCard } from '@/components/feed/post-card';
import { CourseFeedCard } from '@/components/feed/course-feed-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface Post {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  mediaUrls: string[] | null;
  pollOptions: string[] | null;
  fileUrls: string[] | null;
  viewCount: number;
  createdAt: string;
}

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  instructorId: number;
  category: string;
  thumbnail: string | null;
  durationHours: number | null;
  level: string;
  price: number;
  enrolledCount: number;
  rating: number;
  createdAt: string;
}

interface FeedItem {
  type: 'post' | 'course';
  data: Post | Course;
  createdAt: string;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchFeed();

    // Refetch when the page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchFeed();
      }
    };

    const handleFocus = () => {
      fetchFeed();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    // If quick action opened with compose=true, scroll composer into view
    if (searchParams?.get('compose') === 'true') {
      const el = document.getElementById('post-composer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [searchParams]);

  const fetchFeed = async () => {
    try {
      setIsLoading(true);
      const [postsResponse, coursesResponse] = await Promise.all([
        fetch('/api/posts?limit=20'),
        fetch('/api/courses?limit=10'),
      ]);
      
      if (!postsResponse.ok) throw new Error('Failed to fetch posts');
      if (!coursesResponse.ok) throw new Error('Failed to fetch courses');
      
      const postsData = await postsResponse.json();
      const coursesData = await coursesResponse.json();
      
      setPosts(postsData);
      setCourses(coursesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts]);
  };

  // Combine posts and courses into a single feed, sorted by creation date
  const feedItems: FeedItem[] = [
    ...posts.map((post) => ({ type: 'post' as const, data: post, createdAt: post.createdAt })),
    ...courses.map((course) => ({ type: 'course' as const, data: course, createdAt: course.createdAt })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      {/* Post Composer */}
      <PostComposer onPostCreated={handlePostCreated} />

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-3 mb-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        /* Combined Feed */
        <div className="space-y-4">
          {feedItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No posts or courses yet. Be the first to share something!
            </div>
          ) : (
            feedItems.map((item, index) => (
              item.type === 'post' ? (
                <PostCard key={`post-${item.data.id}`} post={item.data as Post} />
              ) : (
                <CourseFeedCard key={`course-${item.data.id}`} course={item.data as Course} />
              )
            ))
          )}
        </div>
      )}
    </div>
  );
}