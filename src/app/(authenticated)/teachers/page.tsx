'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, UserPlus, MessageSquare, Users } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';

interface Teacher {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  bio: string | null;
  schoolId: number | null;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/api/users?role=TEACHER&limit=50', { method: 'GET' });
      setTeachers(data);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Mentorship</h1>
          <p className="text-muted-foreground mt-2">
            Discover and connect with inspiring teachers from around the world
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Teachers Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TeacherSkeleton key={i} />
          ))}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No teachers found
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(Math.floor(Math.random() * 500) + 50);

  const handleFollow = async () => {
    try {
      // TODO: Implement actual follow API
      setIsFollowing(!isFollowing);
      setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
      toast.success(isFollowing ? 'Unfollowed teacher' : 'Following teacher');
    } catch (error) {
      console.error('Failed to follow teacher:', error);
      toast.error('Failed to follow teacher');
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-4">
        <Link href={`/profile/${teacher.id}`} className="block">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-20 h-20 mb-3">
              <AvatarImage src={teacher.avatar || ''} alt={teacher.name} />
              <AvatarFallback className="text-xl">{teacher.name[0]}</AvatarFallback>
            </Avatar>
            <h3 className="font-semibold">{teacher.name}</h3>
            <Badge variant="secondary" className="mt-1 text-xs">
              TEACHER
            </Badge>
            {teacher.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {teacher.bio}
              </p>
            )}
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{followerCount} followers</span>
            </div>
          </div>
        </Link>
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className={`flex-1 ${isFollowing ? 'bg-gray-500 hover:bg-gray-600' : 'bg-[#854cf4] hover:bg-[#7743e0]'} text-white`}
            onClick={handleFollow}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TeacherSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col items-center">
          <Skeleton className="w-20 h-20 rounded-full mb-3" />
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-3 w-24 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}