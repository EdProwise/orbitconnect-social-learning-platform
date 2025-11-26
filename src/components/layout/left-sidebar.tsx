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
    { name: 'Mentorship', href: '/teachers', icon: UserCheck },
    { name: 'Meet GenZ', href: '/profiles', icon: Users },
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
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-[#854cf4]/10 text-[#854cf4]'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="w-5 h-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}