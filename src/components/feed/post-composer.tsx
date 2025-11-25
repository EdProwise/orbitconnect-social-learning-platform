'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  FileText, 
  Image as ImageIcon, 
  HelpCircle, 
  Trophy, 
  BarChart3, 
  BookOpen, 
  Gift
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const postTypes = [
  { value: 'article', label: 'Article', icon: FileText, path: '/create/article' },
  { value: 'photo-video', label: 'Photo/Video', icon: ImageIcon, path: '/create/photo-video' },
  { value: 'question', label: 'Question', icon: HelpCircle, path: '/create/question' },
  { value: 'celebrate', label: 'Celebrate', icon: Trophy, path: '/create/celebrate' },
  { value: 'poll', label: 'Poll', icon: BarChart3, path: '/create/poll' },
  { value: 'study-material', label: 'Study Material', icon: BookOpen, path: '/create/study-material' },
  { value: 'donate-books', label: 'Donate Books', icon: Gift, path: '/create/donate-books' },
];

export function PostComposer() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  const loadUserData = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.name || '');
      setUserAvatar(user.avatar || '');
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

  const handlePostTypeClick = (path: string) => {
    router.push(path);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback>{userName[0] || 'U'}</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">Share your knowledge, {userName}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {postTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.value}
                variant="outline"
                onClick={() => handlePostTypeClick(type.path)}
                className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-[#854cf4]/10 hover:text-[#854cf4] hover:border-[#854cf4]"
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs text-center">{type.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}