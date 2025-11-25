'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, UserPlus, MessageSquare } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  bio: string | null;
  schoolId: number | null;
}

export default function ProfilesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      let url = '/api/users?limit=50';
      if (roleFilter !== 'all') {
        url += `&role=${roleFilter}`;
      }
      const data = await apiRequest(url, { method: 'GET' });
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold font-poppins">Discover People</h1>
        <p className="text-muted-foreground">
          Connect with students, teachers, and schools
        </p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="STUDENT">Students</SelectItem>
              <SelectItem value="TEACHER">Teachers</SelectItem>
              <SelectItem value="SCHOOL">Schools</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <UserSkeleton key={i} />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No users found
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({ user }: { user: User }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-4">
        <Link href={`/profile/${user.id}`} className="block">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-20 h-20 mb-3">
              <AvatarImage src={user.avatar || ''} alt={user.name} />
              <AvatarFallback className="text-xl">{user.name[0]}</AvatarFallback>
            </Avatar>
            <h3 className="font-semibold">{user.name}</h3>
            <Badge variant="secondary" className="mt-1 text-xs">
              {user.role}
            </Badge>
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {user.bio}
              </p>
            )}
          </div>
        </Link>
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1 bg-[#854cf4] hover:bg-[#7743e0] text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Connect
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

function UserSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col items-center">
          <Skeleton className="w-20 h-20 rounded-full mb-3" />
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-full mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}
