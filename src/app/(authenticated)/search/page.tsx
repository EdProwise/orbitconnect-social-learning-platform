'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from '@/components/feed/post-card';
import { Search, Users, FileText, School as SchoolIcon, BookOpen } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

interface SearchResults {
  users: any[];
  posts: any[];
  schools: any[];
  courses: any[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResults>({
    users: [],
    posts: [],
    schools: [],
    courses: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setIsLoading(false);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      
      const [usersData, postsData, schoolsData, coursesData] = await Promise.all([
        apiRequest(`/api/users?search=${encodeURIComponent(searchQuery)}&limit=20`, { method: 'GET' }),
        apiRequest(`/api/posts?search=${encodeURIComponent(searchQuery)}&limit=20`, { method: 'GET' }),
        apiRequest(`/api/schools?search=${encodeURIComponent(searchQuery)}&limit=20`, { method: 'GET' }),
        apiRequest(`/api/courses?search=${encodeURIComponent(searchQuery)}&limit=20`, { method: 'GET' }),
      ]);

      setResults({
        users: usersData || [],
        posts: postsData || [],
        schools: schoolsData || [],
        courses: coursesData || [],
      });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalResults = results.users.length + results.posts.length + results.schools.length + results.courses.length;

  if (!query) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold font-poppins">Search</h1>
        </div>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Enter a search query to find people, posts, schools, and courses
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-poppins mb-2">Search Results</h1>
        <p className="text-muted-foreground">
          {isLoading ? 'Searching...' : `${totalResults} results for "${query}"`}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({totalResults})
          </TabsTrigger>
          <TabsTrigger value="people">
            <Users className="w-4 h-4 mr-2" />
            People ({results.users.length})
          </TabsTrigger>
          <TabsTrigger value="posts">
            <FileText className="w-4 h-4 mr-2" />
            Posts ({results.posts.length})
          </TabsTrigger>
          <TabsTrigger value="schools">
            <SchoolIcon className="w-4 h-4 mr-2" />
            Schools ({results.schools.length})
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="w-4 h-4 mr-2" />
            Courses ({results.courses.length})
          </TabsTrigger>
        </TabsList>

        {/* All Results */}
        <TabsContent value="all" className="space-y-6">
          {isLoading ? (
            <SearchSkeleton />
          ) : totalResults === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No results found for "{query}"
              </CardContent>
            </Card>
          ) : (
            <>
              {results.users.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">People</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.users.slice(0, 6).map((user) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                </div>
              )}

              {results.posts.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Posts</h2>
                  <div className="space-y-4">
                    {results.posts.slice(0, 5).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}

              {results.schools.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Schools</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.schools.slice(0, 6).map((school) => (
                      <SchoolCard key={school.id} school={school} />
                    ))}
                  </div>
                </div>
              )}

              {results.courses.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Courses</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.courses.slice(0, 6).map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* People Tab */}
        <TabsContent value="people" className="space-y-4">
          {isLoading ? (
            <SearchSkeleton />
          ) : results.users.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No people found
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.users.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          {isLoading ? (
            <SearchSkeleton />
          ) : results.posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No posts found
              </CardContent>
            </Card>
          ) : (
            results.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </TabsContent>

        {/* Schools Tab */}
        <TabsContent value="schools" className="space-y-4">
          {isLoading ? (
            <SearchSkeleton />
          ) : results.schools.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No schools found
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.schools.map((school) => (
                <SchoolCard key={school.id} school={school} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          {isLoading ? (
            <SearchSkeleton />
          ) : results.courses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No courses found
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserCard({ user }: { user: any }) {
  return (
    <Link href={`/profile/${user.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatar || ''} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user.name}</p>
              <Badge variant="secondary" className="text-xs">{user.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SchoolCard({ school }: { school: any }) {
  return (
    <Link href={`/schools/${school.slug}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {school.logo ? (
                <img src={school.logo} alt={school.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <SchoolIcon className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{school.name}</p>
              <p className="text-xs text-muted-foreground truncate">{school.location}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CourseCard({ course }: { course: any }) {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-[#854cf4]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{course.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                <span className="text-xs text-muted-foreground">${course.price}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
