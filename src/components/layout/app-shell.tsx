'use client';

import { useState } from 'react';
import { TopNav } from './top-nav';
import { LeftSidebar } from './left-sidebar';
import { RightSidebar } from './right-sidebar';
import { JWTPayload } from '@/lib/auth';

interface AppShellProps {
  children: React.ReactNode;
  user: JWTPayload;
}

export function AppShell({ children, user }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <TopNav user={user} />
      
      <div className="flex pt-16">
        {/* Left Sidebar - hidden on mobile */}
        <aside className="hidden lg:block w-64 fixed left-0 top-16 bottom-0 border-r border-border bg-card overflow-y-auto">
          <LeftSidebar user={user} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 lg:mr-80">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>

        {/* Right Sidebar - hidden on mobile and tablet */}
        <aside className="hidden xl:block w-80 fixed right-0 top-16 bottom-0 border-l border-border bg-card overflow-y-auto">
          <RightSidebar user={user} />
        </aside>
      </div>
    </div>
  );
}
