'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Search, 
  Bell, 
  MessageSquare, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';
import { JWTPayload } from '@/lib/auth';
import { authApi } from '@/lib/api-client';

interface TopNavProps {
  user: JWTPayload;
}

export function TopNav({ user }: TopNavProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [userName, setUserName] = useState('');

  const loadUserData = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUserAvatar(userData.avatar || '');
      setUserName(userData.name || userData.email || '');
    }
  };

  useEffect(() => {
    loadUserData();

    // Listen for storage events to update when profile changes
    const handleStorageChange = () => {
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#854cf4] flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold font-poppins hidden sm:inline">OrbitConnect</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <Badge 
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-[#854cf4] hover:bg-[#854cf4]"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                <NotificationItem
                  title="New comment"
                  message="Sarah Johnson commented on your post"
                  time="5 min ago"
                  unread
                />
                <NotificationItem
                  title="Connection accepted"
                  message="Alex Kumar accepted your connection request"
                  time="1 hour ago"
                  unread
                />
                <NotificationItem
                  title="New course enrolled"
                  message="You've been enrolled in 'Intro to Python'"
                  time="2 hours ago"
                />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/notifications" className="w-full cursor-pointer">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Messages */}
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/messages">
              <MessageSquare className="w-5 h-5" />
              <Badge 
                className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-[#854cf4] hover:bg-[#854cf4]"
              >
                2
              </Badge>
            </Link>
          </Button>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback>{getInitials(userName || user.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName || user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/profile/${user.userId}`} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function NotificationItem({ 
  title, 
  message, 
  time, 
  unread 
}: { 
  title: string; 
  message: string; 
  time: string; 
  unread?: boolean;
}) {
  return (
    <div className={`p-3 hover:bg-accent cursor-pointer transition-colors ${unread ? 'bg-accent/50' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{message}</p>
          <p className="text-xs text-muted-foreground mt-1">{time}</p>
        </div>
        {unread && (
          <div className="w-2 h-2 rounded-full bg-[#854cf4] flex-shrink-0 mt-1" />
        )}
      </div>
    </div>
  );
}