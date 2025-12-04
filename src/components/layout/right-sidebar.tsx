'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TrendingTopics } from '@/components/feed/trending-topics';
import { 
  Plus,
  FileQuestion,
  Video,
  MessageCircle,
  Users
} from 'lucide-react';
import { JWTPayload } from '@/lib/auth';

interface RightSidebarProps {
  user: JWTPayload;
}

export function RightSidebar({ user }: RightSidebarProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/organize/quiz/new">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              size="sm"
            >
              <FileQuestion className="w-4 h-4 mr-2" />
              Create Quiz
            </Button>
          </Link>
          <Link href="/organize/webinar/new">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              size="sm"
            >
              <Video className="w-4 h-4 mr-2" />
              Host Webinar
            </Button>
          </Link>
          <Link href="/organize/debate/new">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              size="sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Organize Debate
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upcoming</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <EventItem
            type="Webinar"
            title="Career Guidance for Tech Students"
            time="Tomorrow, 3:00 PM"
            icon={<Video className="w-4 h-4" />}
          />
          <EventItem
            type="Quiz"
            title="JavaScript Fundamentals Quiz"
            time="In 3 days"
            icon={<FileQuestion className="w-4 h-4" />}
          />
          <EventItem
            type="Debate"
            title="Technology in Education"
            time="Next week"
            icon={<MessageCircle className="w-4 h-4" />}
          />
        </CardContent>
      </Card>

      {/* Suggested Mentors */}
      {user.role === 'STUDENT' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Suggested Mentors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MentorItem
              name="Sarah Johnson"
              expertise="Web Development, AI"
              avatar="https://i.pravatar.cc/150?u=sarah"
              rating={4.8}
            />
            <MentorItem
              name="Michael Chen"
              expertise="Programming, Career"
              avatar="https://i.pravatar.cc/150?u=michael"
              rating={4.9}
            />
          </CardContent>
        </Card>
      )}

      {/* Suggested Colleagues (Teacher) */}
      {user.role === 'TEACHER' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Suggested Colleagues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ColleagueItem
              name="Aisha Verma"
              subjects="Mathematics, Algebra"
              avatar="https://i.pravatar.cc/150?u=aisha"
            />
            <ColleagueItem
              name="Daniel Roberts"
              subjects="Physics, STEM"
              avatar="https://i.pravatar.cc/150?u=daniel"
            />
          </CardContent>
        </Card>
      )}

      {/* Trending Topics */}
      <TrendingTopics />
    </div>
  );
}

function EventItem({ 
  type, 
  title, 
  time, 
  icon 
}: { 
  type: string; 
  title: string; 
  time: string; 
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
      <div className="w-8 h-8 rounded-lg bg-[#854cf4]/10 flex items-center justify-center text-[#854cf4] flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <Badge variant="outline" className="mb-1 text-xs">
          {type}
        </Badge>
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

function MentorItem({ 
  name, 
  expertise, 
  avatar, 
  rating 
}: { 
  name: string; 
  expertise: string; 
  avatar: string; 
  rating: number;
}) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
      <Avatar className="w-10 h-10">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback>{name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{expertise}</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs font-medium">{rating}</span>
          <span className="text-xs text-yellow-500">★</span>
        </div>
      </div>
      <Button size="sm" variant="outline" className="flex-shrink-0">
        <Users className="w-3 h-3 mr-1" />
        Book
      </Button>
    </div>
  );
}

function ColleagueItem({ 
  name, 
  subjects, 
  avatar 
}: { 
  name: string; 
  subjects: string; 
  avatar: string;
}) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
      <Avatar className="w-10 h-10">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback>{name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{subjects}</p>
      </div>
      <Button size="sm" variant="outline" className="flex-shrink-0">
        <Users className="w-3 h-3 mr-1" />
        Follow
      </Button>
    </div>
  );
}

function TopicItem({ topic, posts }: { topic: string; posts: number }) {
  return (
    <Link 
      href={`/explore?topic=${encodeURIComponent(topic)}`}
      className="block p-2 rounded-lg hover:bg-accent transition-colors"
    >
      <p className="text-sm font-medium">{topic}</p>
      <p className="text-xs text-muted-foreground">{posts} posts</p>
    </Link>
  );
}