'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileQuestion, Video, MessageCircle, Plus, Calendar, Users } from 'lucide-react';

export default function OrganizePage() {
  const [activeTab, setActiveTab] = useState('quizzes');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-poppins">Organize Events</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="quizzes">
            <FileQuestion className="w-4 h-4 mr-2" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="webinars">
            <Video className="w-4 h-4 mr-2" />
            Webinars
          </TabsTrigger>
          <TabsTrigger value="debates">
            <MessageCircle className="w-4 h-4 mr-2" />
            Debates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes" className="space-y-6">
          <div className="flex justify-end">
            <Link href="/organize/quiz/new">
              <Button className="bg-[#854cf4] hover:bg-[#7743e0] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Quiz
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>JavaScript Fundamentals Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  5 days remaining
                </span>
                <span className="flex items-center gap-1">
                  <FileQuestion className="w-4 h-4" />
                  5 questions
                </span>
                <span>100 points</span>
              </div>
              <p className="text-sm">
                Test your knowledge of JavaScript basics including variables, functions, and closures.
              </p>
              <Button variant="outline" size="sm">View Details</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webinars" className="space-y-6">
          <div className="flex justify-end">
            <Link href="/organize/webinar/new">
              <Button className="bg-[#854cf4] hover:bg-[#7743e0] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Host Webinar
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Career Guidance for Tech Students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Tomorrow, 3:00 PM
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  23/50 registered
                </span>
                <span>90 minutes</span>
              </div>
              <p className="text-sm">
                Explore career paths in technology, learn about industry trends, and get advice on building your professional portfolio.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">View Details</Button>
                <Button size="sm" className="bg-[#854cf4] hover:bg-[#7743e0] text-white">Register</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debates" className="space-y-6">
          <div className="flex justify-end">
            <Link href="/organize/debate/new">
              <Button className="bg-[#854cf4] hover:bg-[#7743e0] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Organize Debate
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Technology in Education: Boon or Bane</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Next week
                </span>
                <span>Oxford Style Debate</span>
                <span>120 minutes</span>
              </div>
              <p className="text-sm">
                Is technology in classrooms helping or hindering student learning? Debate the pros and cons of digital education.
              </p>
              <Button variant="outline" size="sm">View Details</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
