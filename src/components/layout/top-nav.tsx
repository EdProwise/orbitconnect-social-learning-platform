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

    // Listen for custom profile update events
    const handleProfileUpdate = () => {
      loadUserData();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
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
    <header className="fixed top-0 left-0 right-0 h-20 glass-effect border-b border-border/40 z-50 luxury-shadow">
      <div className="h-full container mx-auto px-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#854cf4] to-[#B8941F] flex items-center justify-center luxury-shadow-lg group-hover:scale-105 transition-transform duration-300">
            <div className="absolute inset-[2px] rounded-[14px] bg-[#854cf4] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold font-poppins hidden sm:inline bg-gradient-to-r from-foreground via-[#854cf4] to-foreground bg-clip-text text-transparent">OrbitConnect</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 rounded-2xl glass-effect border-border/40 focus:border-[#D4AF37]/30 transition-all"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-accent/50 rounded-2xl transition-all hover:scale-105 group">
                <Bell className="w-5 h-5 group-hover:text-[#D4AF37] transition-colors" />
                <Badge 
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-gradient-to-br from-[#854cf4] to-[#9f6fff] text-white border-2 border-background luxury-shadow"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 glass-effect border-border/40 luxury-shadow-lg rounded-2xl">
              <DropdownMenuLabel className="text-base font-semibold">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/40" />
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
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem asChild>
                <Link href="/notifications" className="w-full cursor-pointer font-medium text-[#854cf4] hover:text-[#D4AF37] transition-colors">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Messages */}
          <Button variant="ghost" size="icon" asChild className="relative hover:bg-accent/50 rounded-2xl transition-all hover:scale-105 group">
            <Link href="/messages">
              <MessageSquare className="w-5 h-5 group-hover:text-[#D4AF37] transition-colors" />
              <Badge 
                className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-gradient-to-br from-[#854cf4] to-[#9f6fff] text-white border-2 border-background luxury-shadow"
              >
                2
              </Badge>
            </Link>
          </Button>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-4 hover:ring-[#D4AF37]/20 transition-all hover:scale-105">
                <Avatar className="h-10 w-10 border-2 border-[#D4AF37]/20">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-[#D4AF37]/20 to-[#854cf4]/20 text-foreground font-semibold">{getInitials(userName || user.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-effect border-border/40 luxury-shadow-lg rounded-2xl">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{userName || user.email}</p>
                  <p className="text-xs leading-none text-[#D4AF37] font-medium uppercase tracking-wider">{user.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem asChild>
                <Link href={`/profile/${user.userId}`} className="cursor-pointer hover:bg-accent/50 rounded-xl transition-colors">
                  <User className="mr-2 h-4 w-4 text-[#854cf4]" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer hover:bg-accent/50 rounded-xl transition-colors">
                  <Settings className="mr-2 h-4 w-4 text-[#854cf4]" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-destructive/10 text-destructive rounded-xl transition-colors">
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
    <div className={`group p-4 hover:bg-accent/50 cursor-pointer transition-all rounded-xl m-1 ${unread ? 'bg-accent/30' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate leading-relaxed mt-0.5">{message}</p>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            {time}
          </p>
        </div>
        {unread && (
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#854cf4] flex-shrink-0 mt-1 group-hover:scale-125 transition-transform luxury-shadow" />
        )}
      </div>
    </div>
  );
}