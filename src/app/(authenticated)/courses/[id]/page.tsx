'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Clock, Users, Star, Lock, PlayCircle, DollarSign } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';
import Link from 'next/link';

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  instructorId: number;
  category: string;
  thumbnail: string | null;
  videoUrl: string | null;
  durationHours: number | null;
  level: string;
  price: number;
  enrolledCount: number;
  rating: number;
  hasAccess?: boolean;
}

interface Instructor {
  id: number;
  name: string;
  avatar: string | null;
  bio: string | null;
  role: string;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      fetchCourse(user.id);
    } else {
      router.push('/login');
    }
  }, [courseId]);

  const fetchCourse = async (userId: number) => {
    try {
      setIsLoading(true);
      // Fetch course with userId to check access
      const courseData = await apiRequest(`/api/courses?id=${courseId}&userId=${userId}`, { 
        method: 'GET' 
      });
      setCourse(courseData);

      // Fetch instructor details
      const instructorData = await apiRequest(`/api/users?id=${courseData.instructorId}`, { 
        method: 'GET' 
      });
      setInstructor(instructorData);
    } catch (error: any) {
      console.error('Failed to fetch course:', error);
      toast.error('Failed to load course');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!currentUser) {
      toast.error('Please log in to enroll');
      return;
    }

    if (!course) return;

    // For paid courses, show payment message (in production, integrate payment gateway)
    if (course.price > 0) {
      toast.info(`Payment integration required. Course price: $${course.price.toFixed(2)}`);
      // In production, redirect to payment page
      return;
    }

    setIsEnrolling(true);
    try {
      // Enroll in free course
      await apiRequest('/api/course-enrollments', {
        method: 'POST',
        body: JSON.stringify({
          courseId: course.id,
          userId: currentUser.id,
        }),
      });

      toast.success('Enrolled successfully!');
      // Refresh course data to update access
      await fetchCourse(currentUser.id);
    } catch (error: any) {
      console.error('Failed to enroll:', error);
      toast.error(error.message || 'Failed to enroll');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const isFree = course.price === 0;
  const hasAccess = course.hasAccess || false;
  const isInstructor = currentUser && currentUser.id === course.instructorId;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Course Header */}
      <Card>
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Video Player or Thumbnail */}
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-black relative">
                {hasAccess || isInstructor ? (
                  // Show video if user has access
                  course.videoUrl ? (
                    <video
                      src={course.videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full"
                      poster={course.thumbnail || undefined}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <div className="text-center text-muted-foreground">
                        <PlayCircle className="w-12 h-12 mx-auto mb-2" />
                        <p>No video available</p>
                      </div>
                    </div>
                  )
                ) : (
                  // Show locked thumbnail for users without access
                  <div className="relative w-full h-full">
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#854cf4]/20 to-[#6b3cc9]/20">
                        <BookOpen className="w-16 h-16 text-[#854cf4]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <Lock className="w-12 h-12 text-white mb-4" />
                      <p className="text-white text-lg font-semibold mb-2">
                        {isFree ? 'Enroll to Watch' : 'Purchase to Watch'}
                      </p>
                      {!isFree && (
                        <p className="text-white/80 text-sm">
                          ${course.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Course Info */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{course.category}</Badge>
                  <Badge variant="outline">{course.level}</Badge>
                  {isFree && (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white">
                      FREE
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold font-poppins mb-3">
                  {course.title}
                </h1>
                {course.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {course.description}
                  </p>
                )}
              </div>

              {/* Course Stats */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {course.durationHours && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{course.durationHours} hours</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{course.enrolledCount} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{course.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Instructor Info */}
              {instructor && (
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">Instructor</p>
                    <Link href={`/profile/${instructor.id}`}>
                      <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={instructor.avatar || ''} alt={instructor.name} />
                          <AvatarFallback>{instructor.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{instructor.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {instructor.role}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                    {instructor.bio && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {instructor.bio}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Enrollment/Access Button */}
              {!isInstructor && (
                <div className="space-y-3 pt-4 border-t">
                  {hasAccess ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <PlayCircle className="w-5 h-5" />
                      <span className="font-medium">You have access to this course</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="text-3xl font-bold text-[#854cf4]">
                            {isFree ? 'FREE' : `$${course.price.toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleEnroll}
                        disabled={isEnrolling}
                        className="w-full bg-[#854cf4] hover:bg-[#7743e0] text-white h-12 text-lg"
                      >
                        {isEnrolling ? (
                          'Enrolling...'
                        ) : isFree ? (
                          <>
                            <PlayCircle className="w-5 h-5 mr-2" />
                            Enroll for Free
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-5 h-5 mr-2" />
                            Purchase Course
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {isInstructor && (
                <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    You are the instructor of this course
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Details */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold font-poppins mb-4">About this course</h2>
          <div className="prose dark:prose-invert max-w-none">
            {course.description ? (
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {course.description}
              </p>
            ) : (
              <p className="text-muted-foreground italic">No detailed description available.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="aspect-video rounded-lg" />
            <div className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Card>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}