'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Star, DollarSign, BookOpen, Users } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

interface Tutor {
  id: number;
  tutorId: number;
  subjects: string[];
  experienceYears: number;
  hourlyRate: number;
  rating: number;
  totalStudents: number;
  bio: string | null;
}

interface TutorUser {
  id: number;
  name: string;
  avatar: string | null;
  role: string;
}

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/api/tutors?limit=20', { method: 'GET' });
      setTutors(data);
    } catch (error) {
      console.error('Failed to fetch tutors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.subjects.some(sub => 
      sub.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesSubject = subjectFilter === 'all' || tutor.subjects.includes(subjectFilter);
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold font-poppins">Find a Tutor</h1>
        <p className="text-muted-foreground">
          Get personalized help from experienced tutors across various subjects
        </p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
              <SelectItem value="Physics">Physics</SelectItem>
              <SelectItem value="Programming">Programming</SelectItem>
              <SelectItem value="Computer Science">Computer Science</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tutors Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TutorSkeleton key={i} />
          ))}
        </div>
      ) : filteredTutors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No tutors found
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      )}
    </div>
  );
}

function TutorCard({ tutor }: { tutor: Tutor }) {
  const [user, setUser] = useState<TutorUser | null>(null);

  useEffect(() => {
    fetchUser();
  }, [tutor.tutorId]);

  const fetchUser = async () => {
    try {
      const data = await apiRequest(`/api/users?id=${tutor.tutorId}`, { method: 'GET' });
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch tutor user:', error);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user?.avatar || ''} alt={user?.name || 'Tutor'} />
            <AvatarFallback>{user?.name?.[0] || 'T'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{user?.name || 'Loading...'}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{tutor.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">
                ({tutor.totalStudents} students)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tutor.experienceYears} years experience
            </p>
          </div>
        </div>

        {tutor.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3">{tutor.bio}</p>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Subjects:</p>
          <div className="flex flex-wrap gap-2">
            {tutor.subjects.slice(0, 3).map((subject, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {subject}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-lg font-semibold text-[#854cf4]">
            ${tutor.hourlyRate}/hr
          </span>
          <Button 
            size="sm"
            className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Book Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TutorSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
