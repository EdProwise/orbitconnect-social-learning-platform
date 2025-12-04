'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, Check, X, UserCheck } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  bio: string | null;
}

interface ConnectionRequest {
  id: number;
  requesterId: number;
  receiverId: number;
  status: string;
  createdAt: string;
  requester?: User;
}

export default function ConnectionRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  // Get current user
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  useEffect(() => {
    // Redirect non-students away from this page
    if (currentUser.role !== 'STUDENT') {
      toast.error('This page is only available for students');
      router.push('/feed');
      return;
    }
    
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      // Fetch all connections for current user
      const connections = await apiRequest(`/api/connections?userId=${currentUser.id}`, { method: 'GET' });
      
      // Filter for pending requests where current user is receiver
      const pendingRequests = connections.filter(
        (conn: ConnectionRequest) => conn.receiverId === currentUser.id && conn.status === 'PENDING'
      );

      // Fetch requester details for each request
      const requestsWithUsers = await Promise.all(
        pendingRequests.map(async (request: ConnectionRequest) => {
          try {
            const requester = await apiRequest(`/api/users/${request.requesterId}`, { method: 'GET' });
            return { ...request, requester };
          } catch (error) {
            console.error('Failed to fetch requester:', error);
            return request;
          }
        })
      );

      setRequests(requestsWithUsers);
    } catch (error) {
      console.error('Failed to fetch connection requests:', error);
      toast.error('Failed to load connection requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (connectionId: number, requesterId: number) => {
    setProcessingIds(prev => new Set(prev).add(connectionId));
    try {
      await apiRequest(`/api/connections/${connectionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACCEPTED' })
      });
      toast.success('Connection request accepted!');
      await fetchRequests(); // Refresh list
    } catch (error) {
      console.error('Failed to accept connection:', error);
      toast.error('Failed to accept connection request');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(connectionId);
        return next;
      });
    }
  };

  const handleDecline = async (connectionId: number) => {
    setProcessingIds(prev => new Set(prev).add(connectionId));
    try {
      await apiRequest(`/api/connections/${connectionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'REJECTED' })
      });
      toast.success('Connection request declined');
      await fetchRequests(); // Refresh list
    } catch (error) {
      console.error('Failed to decline connection:', error);
      toast.error('Failed to decline connection request');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(connectionId);
        return next;
      });
    }
  };

  // Don't render if not a student
  if (currentUser.role !== 'STUDENT') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#854cf4]/10 to-[#D4AF37]/10 luxury-shadow">
          <UserPlus className="w-6 h-6 text-[#854cf4]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-poppins luxury-text-gradient">Connection Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage your incoming connection requests
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <RequestSkeleton key={i} />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="glass-effect luxury-shadow">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <UserCheck className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">No pending requests</h3>
                <p className="text-muted-foreground text-sm">
                  You don't have any connection requests at the moment
                </p>
              </div>
              <Button 
                onClick={() => router.push('/profiles')} 
                className="mt-2 bg-[#854cf4] hover:bg-[#7743e0] text-white"
              >
                Discover Students
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onAccept={handleAccept}
              onDecline={handleDecline}
              isProcessing={processingIds.has(request.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  request,
  onAccept,
  onDecline,
  isProcessing
}: {
  request: ConnectionRequest;
  onAccept: (connectionId: number, requesterId: number) => void;
  onDecline: (connectionId: number) => void;
  isProcessing: boolean;
}) {
  const requester = request.requester;

  if (!requester) {
    return null;
  }

  const timeAgo = new Date(request.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Card className="glass-effect luxury-shadow hover:luxury-shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Link href={`/profile/${requester.id}`}>
            <Avatar className="w-16 h-16 cursor-pointer hover:scale-105 transition-transform">
              <AvatarImage src={requester.avatar || ''} alt={requester.name} />
              <AvatarFallback className="text-lg bg-gradient-to-br from-[#854cf4] to-[#D4AF37] text-white">
                {requester.name[0]}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={`/profile/${requester.id}`} className="hover:underline">
              <h3 className="font-semibold text-lg">{requester.name}</h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {requester.role}
              </Badge>
              <span className="text-xs text-muted-foreground">• {timeAgo}</span>
            </div>
            {requester.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {requester.bio}
              </p>
            )}
          </div>

          <div className="flex gap-2 ml-4">
            <Button
              size="sm"
              onClick={() => onAccept(request.id, requester.id)}
              disabled={isProcessing}
              className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDecline(request.id)}
              disabled={isProcessing}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RequestSkeleton() {
  return (
    <Card className="glass-effect">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
