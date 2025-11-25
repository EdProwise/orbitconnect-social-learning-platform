'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Users, GraduationCap, ExternalLink } from 'lucide-react';
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

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/api/schools?limit=50', { method: 'GET' });
      setSchools(data);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold font-poppins">Schools</h1>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <SchoolSkeleton key={i} />
          ))}
        </div>
      ) : filteredSchools.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No schools found
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchools.map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>
      )}
    </div>
  );
}

function SchoolCard({ school }: { school: School }) {
  return (
    <Link href={`/schools/${school.slug}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <div className="aspect-video bg-muted rounded-t-xl overflow-hidden relative">
          {school.coverImage ? (
            <img src={school.coverImage} alt={school.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#854cf4]/20 to-[#6b3cc9]/20">
              <GraduationCap className="w-12 h-12 text-[#854cf4]" />
            </div>
          )}
          {school.logo && (
            <div className="absolute bottom-3 left-3 w-16 h-16 rounded-lg bg-white border-2 border-white shadow-lg overflow-hidden">
              <img src={school.logo} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{school.name}</h3>
            {school.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {school.location}
              </p>
            )}
          </div>

          {school.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {school.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {school.studentCount} students
            </span>
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              {school.teacherCount} teachers
            </span>
          </div>

          {school.establishedYear && (
            <p className="text-xs text-muted-foreground">
              Est. {school.establishedYear}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function SchoolSkeleton() {
  return (
    <Card>
      <Skeleton className="aspect-video rounded-t-xl" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}
