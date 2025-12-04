'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  School,
  Calendar,
  UserCheck,
  GraduationCap,
  BookOpen,
  Bookmark,
  UserCircle,
} from 'lucide-react';
import { JWTPayload } from '@/lib/auth';

interface LeftSidebarProps {
  user: JWTPayload;
}

export function LeftSidebar({ user }: LeftSidebarProps) {
  const pathname = usePathname();

  const navigationItems = [
    { name: 'Home', href: '/feed', icon: Home },
    { name: user.role === 'STUDENT' ? 'Mentors' : 'Collegues', href: '/teachers', icon: UserCheck },
    // Only show "Meet GenZ" for students
    ...(user.role === 'STUDENT' ? [{ name: 'Meet GenZ', href: '/profiles', icon: Users }] : []),
    { name: 'Discover School', href: '/schools', icon: School },
    { name: 'Organize', href: '/organize', icon: Calendar },
    { name: 'Tutors', href: '/tutors', icon: GraduationCap },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Saved', href: '/saved', icon: Bookmark },
    { name: 'Profile', href: `/profile/${user.userId}`, icon: UserCircle },
  ];

  return (
    <nav className="p-4 space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 group relative overflow-hidden',
              isActive
                ? 'bg-gradient-to-r from-[#854cf4]/10 via-[#9f6fff]/10 to-[#854cf4]/10 text-[#854cf4] luxury-shadow'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:scale-[1.02]'
            )}
          >
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 via-transparent to-[#D4AF37]/5 animate-pulse" />
            )}
            <Icon className={cn(
              "w-5 h-5 relative z-10 transition-all duration-300",
              isActive 
                ? "text-[#854cf4]" 
                : "group-hover:text-[#D4AF37] group-hover:scale-110"
            )} />
            <span className="relative z-10">{item.name}</span>
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#D4AF37] via-[#854cf4] to-[#D4AF37] rounded-r-full luxury-shadow" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}