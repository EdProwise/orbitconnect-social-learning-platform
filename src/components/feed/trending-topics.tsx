'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Hash } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

interface Tag {
  id: number;
  name: string;
  postCount: number;
}

export function TrendingTopics() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrendingTags();
  }, []);

  const fetchTrendingTags = async () => {
    try {
      const data = await apiRequest('/api/tags?limit=10&orderBy=popularity', {
        method: 'GET',
      });
      setTags(data.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch trending tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#854cf4]" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-muted animate-pulse rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#854cf4]" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tags.map((tag, index) => (
          <Link
            key={tag.id}
            href={`/feed?tag=${encodeURIComponent(tag.name)}`}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors group"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground w-5">
                {index + 1}
              </span>
              <Hash className="w-3 h-3 text-[#854cf4]" />
              <span className="text-sm font-medium group-hover:text-[#854cf4] transition-colors">
                {tag.name}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {tag.postCount} {tag.postCount === 1 ? 'post' : 'posts'}
            </Badge>
          </Link>
        ))}
        <Link
          href="/trending"
          className="block text-center text-sm text-[#854cf4] hover:underline pt-2"
        >
          View all trending
        </Link>
      </CardContent>
    </Card>
  );
}
