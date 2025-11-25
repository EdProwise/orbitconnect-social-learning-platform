'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from '@/components/feed/post-card';
import {
  MapPin,
  Globe,
  Calendar,
  Users,
  GraduationCap,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

interface School {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  location: string | null;
  website: string | null;
  studentCount: number;
  teacherCount: number;
  establishedYear: number | null;
}

export default function SchoolPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [school, setSchool] = useState<School | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchSchool();
    }
  }, [slug]);

  const fetchSchool = async () => {
    try {
      setIsLoading(true);
      
      // Fetch school by slug - need to get all schools and filter
      const schoolsData = await apiRequest('/api/schools?limit=100', { method: 'GET' });
      const schoolData = schoolsData.find((s: School) => s.slug === slug);
      
      if (!schoolData) {
        throw new Error('School not found');
      }

      setSchool(schoolData);

      // Fetch school posts and courses
      const [postsData, coursesData] = await Promise.all([
        apiRequest(`/api/posts?schoolId=${schoolData.id}&limit=20`, { method: 'GET' }),
        apiRequest(`/api/courses?schoolId=${schoolData.id}&limit=20`, { method: 'GET' }),
      ]);

      setPosts(postsData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to fetch school:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <SchoolSkeleton />;
  }

  if (!school) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">School not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card>
        <div className="h-48 bg-gradient-to-br from-[#854cf4] to-[#6b3cc9] rounded-t-xl relative overflow-hidden">
          {school.coverImage && (
            <img 
              src={school.coverImage} 
              alt={school.name}
              className="w-full h-full object-cover opacity-50"
            />
          )}
        </div>
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 mb-6">
            <div className="w-32 h-32 rounded-xl border-4 border-card bg-card overflow-hidden flex-shrink-0">
              {school.logo ? (
                <img src={school.logo} alt={school.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <GraduationCap className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold font-poppins">{school.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                {school.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {school.location}
                  </span>
                )}
                {school.website && (
                  <a 
                    href={school.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {school.establishedYear && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Est. {school.establishedYear}
                  </span>
                )}
              </div>
            </div>
            <Button className="bg-[#854cf4] hover:bg-[#7743e0] text-white">
              Follow School
            </Button>
          </div>

          {school.description && (
            <p className="text-sm text-muted-foreground mb-4">{school.description}</p>
          )}

          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{school.studentCount}</span>
              <span className="text-muted-foreground">Students</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{school.teacherCount}</span>
              <span className="text-muted-foreground">Teachers</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{courses.length}</span>
              <span className="text-muted-foreground">Courses</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="updates">
        <TabsList>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="courses">Programs & Courses</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No updates yet
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm text-muted-foreground">
                  {school.description || 'No description available'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-sm text-muted-foreground">{school.location}</p>
              </div>
              {school.website && (
                <div>
                  <h3 className="font-semibold mb-2">Website</h3>
                  <a 
                    href={school.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#854cf4] hover:underline"
                  >
                    {school.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <div className="grid sm:grid-cols-2 gap-4">
            {courses.length === 0 ? (
              <Card className="sm:col-span-2">
                <CardContent className="p-12 text-center text-muted-foreground">
                  No courses available
                </CardContent>
              </Card>
            ) : (
              courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <Badge variant="secondary">{course.category}</Badge>
                        <Badge variant="outline">{course.level}</Badge>
                      </div>
                      <h3 className="font-semibold">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {course.enrolledCount} enrolled
                        </span>
                        <span className="font-semibold text-[#854cf4]">
                          ${course.price}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center py-8">
                Staff directory coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SchoolSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <Skeleton className="h-48 rounded-t-xl" />
        <CardContent className="pt-0 pb-6">
          <div className="flex items-end gap-4 -mt-16 mb-6">
            <Skeleton className="w-32 h-32 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UserSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col items-center">
          <Skeleton className="w-20 h-20 rounded-full mb-3" />
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}