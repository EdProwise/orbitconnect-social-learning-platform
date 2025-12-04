'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, UserPlus, MessageSquare, UserCheck, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  bio: string | null;
  schoolId: number | null;
}

interface Connection {
  id: number;
  requesterId: number;
  receiverId: number;
  status: string;
}

export default function ProfilesPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Get current user
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  useEffect(() => {
    // Redirect teachers and schools away from this page
    if (currentUser.role === 'TEACHER' || currentUser.role === 'SCHOOL') {
      toast.error('This page is only available for students');
      router.push('/feed');
      return;
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch users and connections in parallel
      const [usersData, connectionsData] = await Promise.all([
        apiRequest('/api/users?role=STUDENT&limit=50', { method: 'GET' }),
        apiRequest(`/api/connections?userId=${currentUser.id}`, { method: 'GET' })
      ]);
      setUsers(usersData);
      setConnections(connectionsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.id !== currentUser.id && // Don't show current user
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Don't render if not a student
  if (currentUser.role === 'TEACHER' || currentUser.role === 'SCHOOL') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Meet GenZ Students</h1>
          <p className="text-muted-foreground mt-2">
            Connect with students from around the world
          </p>
        </div>

        {/* Search Only - No Filters */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
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
            No students found
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <UserCard 
              key={user.id} 
              user={user} 
              currentUserId={currentUser.id}
              connections={connections}
              onConnectionChange={fetchData}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({ 
  user, 
  currentUserId, 
  connections,
  onConnectionChange 
}: { 
  user: User; 
  currentUserId: number;
  connections: Connection[];
  onConnectionChange: () => void;
}) {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  // Find connection between current user and this user
  const connection = connections.find(
    conn => 
      (conn.requesterId === currentUserId && conn.receiverId === user.id) ||
      (conn.receiverId === currentUserId && conn.requesterId === user.id)
  );

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await apiRequest('/api/connections', {
        method: 'POST',
        body: JSON.stringify({
          requesterId: currentUserId,
          receiverId: user.id
        })
      });
      toast.success('Connection request sent!');
      onConnectionChange(); // Refresh connections
    } catch (error: any) {
      console.error('Failed to send connection request:', error);
      if (error.code === 'DUPLICATE_CONNECTION') {
        toast.error('Connection request already exists');
      } else {
        toast.error('Failed to send connection request');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleMessage = () => {
    // Only allow messaging if connected
    if (connection?.status === 'ACCEPTED') {
      router.push(`/messages?userId=${user.id}`);
    } else {
      toast.error('You must be connected to send messages');
    }
  };

  const renderConnectButton = () => {
    if (!connection) {
      // No connection - show Connect button
      return (
        <Button 
          size="sm" 
          className="flex-1 bg-[#854cf4] hover:bg-[#7743e0] text-white"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {isConnecting ? 'Connecting...' : 'Connect'}
        </Button>
      );
    }

    if (connection.status === 'PENDING') {
      // Pending connection
      if (connection.requesterId === currentUserId) {
        // Current user sent the request
        return (
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1"
            disabled
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending
          </Button>
        );
      } else {
        // Current user received the request - could add Accept button here
        return (
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/notifications')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Respond
          </Button>
        );
      }
    }

    if (connection.status === 'ACCEPTED') {
      // Connected
      return (
        <Button 
          size="sm" 
          variant="outline"
          className="flex-1 border-[#854cf4] text-[#854cf4]"
          disabled
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Connected
        </Button>
      );
    }

    // Rejected or other status - show Connect again
    return (
      <Button 
        size="sm" 
        className="flex-1 bg-[#854cf4] hover:bg-[#7743e0] text-white"
        onClick={handleConnect}
        disabled={isConnecting}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Connect
      </Button>
    );
  };

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
              STUDENT
            </Badge>
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {user.bio}
              </p>
            )}
          </div>
        </Link>
        <div className="flex gap-2 pt-2">
          {renderConnectButton()}
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={handleMessage}
            disabled={connection?.status !== 'ACCEPTED'}
          >
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