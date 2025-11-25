'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from '@/components/feed/post-card';
import {
  UserPlus,
  MessageSquare,
  MapPin,
  Calendar,
  School as SchoolIcon,
  Mail,
  Loader2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  bio: string | null;
  schoolId: number | null;
  createdAt: string;
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const [profileData, postsData, connectionsData] = await Promise.all([
        apiRequest(`/api/users?id=${userId}`, { method: 'GET' }),
        apiRequest(`/api/posts?userId=${userId}&limit=10`, { method: 'GET' }),
        apiRequest(`/api/connections?userId=${userId}&status=ACCEPTED`, { method: 'GET' }),
      ]);

      setProfile(profileData);
      setPosts(postsData);
      setConnections(connectionsData);

      // Fetch school if user has one
      if (profileData.schoolId) {
        const schoolData = await apiRequest(`/api/schools?id=${profileData.schoolId}`, { method: 'GET' });
        setSchool(schoolData);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      await apiRequest('/api/connections', {
        method: 'POST',
        body: JSON.stringify({
          requesterId: 5, // TODO: Get from auth context
          receiverId: parseInt(userId),
        }),
      });
      alert('Connection request sent!');
    } catch (error) {
      console.error('Failed to send connection request:', error);
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cover Image */}
      <Card>
        <div className="h-48 bg-gradient-to-br from-[#854cf4] to-[#6b3cc9] rounded-t-xl" />
        <CardContent className="relative pt-0 pb-6">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 mb-6">
            <Avatar className="w-32 h-32 border-4 border-card">
              <AvatarImage src={profile.avatar || ''} alt={profile.name} />
              <AvatarFallback className="text-2xl">{profile.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-poppins">{profile.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{profile.role}</Badge>
                    {school && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <SchoolIcon className="w-3 h-3" />
                        {school.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleConnect}
                    className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                  <Button variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-semibold">{connections.length}</span>
              <span className="text-muted-foreground ml-1">Connections</span>
            </div>
            <div>
              <span className="font-semibold">{posts.length}</span>
              <span className="text-muted-foreground ml-1">Posts</span>
            </div>
            <div>
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="materials">Study Materials</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">About</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
                {school && (
                  <div className="flex items-center gap-3">
                    <SchoolIcon className="w-4 h-4 text-muted-foreground" />
                    <span>{school.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <div className="space-y-4">
            <h3 className="font-semibold">Recent Posts</h3>
            {posts.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No posts yet
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          {posts.filter(p => p.type === 'STUDY_MATERIAL').length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No study materials shared yet
              </CardContent>
            </Card>
          ) : (
            posts
              .filter(p => p.type === 'STUDY_MATERIAL')
              .map((post) => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {connections.map((connection) => (
              <ConnectionCard key={connection.id} connection={connection} currentUserId={parseInt(userId)} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <Skeleton className="h-48 rounded-t-xl" />
        <CardContent className="pt-0 pb-6">
          <div className="flex items-end gap-4 -mt-16 mb-6">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConnectionCard({ connection, currentUserId }: { connection: any; currentUserId: number }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUser();
  }, [connection]);

  const fetchUser = async () => {
    try {
      const userId = connection.requesterId === currentUserId 
        ? connection.receiverId 
        : connection.requesterId;
      const data = await apiRequest(`/api/users?id=${userId}`, { method: 'GET' });
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar || ''} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{user.name}</p>
            <Badge variant="secondary" className="text-xs">{user.role}</Badge>
          </div>
          <Button size="sm" variant="outline">
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
