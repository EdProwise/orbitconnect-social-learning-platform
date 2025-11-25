'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Star, Calendar, DollarSign, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

interface Mentor {
  id: number;
  mentorId: number;
  expertise: string[];
  availability: any;
  hourlyRate: number;
  rating: number;
  totalSessions: number;
  bio: string | null;
}

interface MentorUser {
  id: number;
  name: string;
  avatar: string | null;
  role: string;
}

export default function MentorshipPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/api/mentorships?limit=20', { method: 'GET' });
      setMentors(data);
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMentors = mentors.filter(mentor =>
    mentor.expertise.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold font-poppins">Find a Mentor</h1>
        <p className="text-muted-foreground">
          Connect with experienced mentors to guide your learning journey
        </p>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Mentors Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <MentorSkeleton key={i} />
          ))}
        </div>
      ) : filteredMentors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No mentors found
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => (
            <MentorCard 
              key={mentor.id} 
              mentor={mentor} 
              onBookClick={() => setSelectedMentor(mentor)}
            />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <Dialog open={!!selectedMentor} onOpenChange={() => setSelectedMentor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a Mentorship Session</DialogTitle>
            <DialogDescription>
              Schedule a one-on-one session with your mentor
            </DialogDescription>
          </DialogHeader>
          {selectedMentor && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div>
                  <p className="font-semibold">Mentor Details</p>
                  <p className="text-sm text-muted-foreground">
                    ${selectedMentor.hourlyRate}/hour
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Expertise:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMentor.expertise.map((exp, i) => (
                    <Badge key={i} variant="secondary">{exp}</Badge>
                  ))}
                </div>
              </div>
              {selectedMentor.availability && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Available:</p>
                  <div className="text-sm text-muted-foreground">
                    {Object.entries(selectedMentor.availability).map(([day, time]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize">{day}:</span>
                        <span>{time as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMentor(null)}>
              Cancel
            </Button>
            <Button className="bg-[#854cf4] hover:bg-[#7743e0] text-white">
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MentorCard({ mentor, onBookClick }: { mentor: Mentor; onBookClick: () => void }) {
  const [user, setUser] = useState<MentorUser | null>(null);

  useEffect(() => {
    fetchUser();
  }, [mentor.mentorId]);

  const fetchUser = async () => {
    try {
      const data = await apiRequest(`/api/users?id=${mentor.mentorId}`, { method: 'GET' });
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch mentor user:', error);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user?.avatar || ''} alt={user?.name || 'Mentor'} />
            <AvatarFallback>{user?.name?.[0] || 'M'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{user?.name || 'Loading...'}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{mentor.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">
                ({mentor.totalSessions} sessions)
              </span>
            </div>
          </div>
        </div>

        {mentor.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3">{mentor.bio}</p>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Expertise:</p>
          <div className="flex flex-wrap gap-2">
            {mentor.expertise.slice(0, 3).map((exp, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {exp}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-lg font-semibold text-[#854cf4]">
            ${mentor.hourlyRate}/hr
          </span>
          <Button 
            size="sm"
            onClick={onBookClick}
            className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Book Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MentorSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
