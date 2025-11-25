'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PostCard } from '@/components/feed/post-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

interface SavedPost {
  id: number;
  userId: number;
  postId: number;
  createdAt: string;
}

export default function SavedPage() {
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserId = 5; // TODO: Get from auth context

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    try {
      setIsLoading(true);
      const savedData = await apiRequest(
        `/api/saved-posts?userId=${currentUserId}&limit=50`,
        { method: 'GET' }
      );

      // Fetch actual post data for each saved post
      const posts = await Promise.all(
        savedData.map(async (saved: SavedPost) => {
          try {
            return await apiRequest(`/api/posts?id=${saved.postId}`, { method: 'GET' });
          } catch (error) {
            return null;
          }
        })
      );

      setSavedPosts(posts.filter(p => p !== null));
    } catch (error) {
      console.error('Failed to fetch saved posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-poppins">Saved Posts</h1>
        <p className="text-muted-foreground mt-1">
          Posts you've bookmarked for later
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : savedPosts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No saved posts yet</p>
            <p className="text-sm mt-2">
              Bookmark posts to read them later
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {savedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
