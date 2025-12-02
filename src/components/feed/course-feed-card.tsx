'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Users, Star, PlayCircle, Lock, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/api-client';

interface CourseFeedCardProps {
  course: {
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
  };
}

interface UserData {
  id: number;
  name: string;
  role: string;
  avatar: string | null;
}

export function CourseFeedCard({ course }: CourseFeedCardProps) {
  const [instructor, setInstructor] = useState<UserData | null>(null);

  useEffect(() => {
    fetchInstructor();
  }, [course.instructorId]);

  const fetchInstructor = async () => {
    try {
      const data = await apiRequest(`/api/users?id=${course.instructorId}`, { method: 'GET' });
      setInstructor(data);
    } catch (error) {
      console.error('Failed to fetch instructor:', error);
    }
  };

  const isFree = course.price === 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Author Header */}
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/profile/${course.instructorId}`}>
            <Avatar className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={instructor?.avatar || ''} alt={instructor?.name || 'Instructor'} />
              <AvatarFallback>{instructor?.name?.[0] || 'I'}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <Link href={`/profile/${course.instructorId}`} className="hover:underline">
              <h4 className="font-semibold text-base">{instructor?.name || 'Loading...'}</h4>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>uploaded a new course</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(course.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        {/* Course Thumbnail */}
        <Link href={`/courses/${course.id}`} className="block">
          <div className="relative aspect-video rounded-lg overflow-hidden mb-4 group">
            {course.thumbnail ? (
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#854cf4]/20 to-[#6b3cc9]/20">
                <BookOpen className="w-16 h-16 text-[#854cf4]" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-black/90 rounded-full p-4">
                {isFree ? (
                  <PlayCircle className="w-8 h-8 text-[#854cf4]" />
                ) : (
                  <Lock className="w-8 h-8 text-[#854cf4]" />
                )}
              </div>
            </div>
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className="bg-[#854cf4] text-white">Course</Badge>
              {isFree && (
                <Badge className="bg-green-500 text-white">FREE</Badge>
              )}
            </div>
          </div>
        </Link>

        {/* Course Info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <Link href={`/courses/${course.id}`} className="hover:underline">
                <h3 className="text-xl font-semibold font-poppins leading-tight">
                  {course.title}
                </h3>
              </Link>
              {course.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {course.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {course.level}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              {course.durationHours && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {course.durationHours}h
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {course.enrolledCount}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {course.rating.toFixed(1)}
              </span>
            </div>
            <div className="font-semibold text-lg text-[#854cf4]">
              {isFree ? 'FREE' : `$${course.price.toFixed(2)}`}
            </div>
          </div>

          {/* Action Button */}
          <Link href={`/courses/${course.id}`}>
            <Button className="w-full bg-[#854cf4] hover:bg-[#7743e0] text-white">
              {isFree ? (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  View Course
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  View Details
                </>
              )}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
