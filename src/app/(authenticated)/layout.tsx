'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { JWTPayload } from '@/lib/auth';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for user in localStorage (iframe-compatible)
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#854cf4]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Map stored user to JWTPayload format
  const jwtUser: JWTPayload = {
    userId: user.id || user.userId,
    email: user.email,
    role: user.role as 'STUDENT' | 'TEACHER' | 'SCHOOL' | 'ADMIN',
  };

  return <AppShell user={jwtUser}>{children}</AppShell>;
}