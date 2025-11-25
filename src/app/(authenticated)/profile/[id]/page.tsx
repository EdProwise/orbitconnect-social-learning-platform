'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PostCard } from '@/components/feed/post-card';
import {
  UserPlus,
  MessageSquare,
  MapPin,
  Calendar,
  School as SchoolIcon,
  Mail,
  Loader2,
  Camera,
  Edit2,
  Save,
  X,
  Phone as PhoneIcon,
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  coverImage: string | null;
  bio: string | null;
  schoolId: number | null;
  createdAt: string;
  currentTown?: string | null;
  phone?: string | null;
  socialMediaLinks?: { instagram?: string; twitter?: string; linkedin?: string } | null;
  class?: string | null;
  schoolHistory?: Array<{ schoolName: string; from: string; to: string }> | null;
  aboutYourself?: string | null;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    currentTown: '',
    phone: '',
    socialMediaLinks: { instagram: '', twitter: '', linkedin: '' },
    class: '',
    schoolHistory: [{ schoolName: '', from: '', to: '' }],
    aboutYourself: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState<'avatar' | 'cover' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Get current user
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const isOwnProfile = currentUser.userId === parseInt(userId);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const [profileData, postsData, connectionsData] = await Promise.all([
        apiRequest(`/api/users?id=${userId}`, { method: 'GET' }),
        apiRequest(`/api/posts?userId=${userId}&limit=10`, { method: 'GET' }),
        apiRequest(`/api/connections?userId=${userId}&status=ACCEPTED`, { method: 'GET' }),
      ]);

      setProfile(profileData);
      setEditForm({
        name: profileData.name,
        bio: profileData.bio || '',
        currentTown: profileData.currentTown || '',
        phone: profileData.phone || '',
        socialMediaLinks: profileData.socialMediaLinks || { instagram: '', twitter: '', linkedin: '' },
        class: profileData.class || '',
        schoolHistory: profileData.schoolHistory || [{ schoolName: '', from: '', to: '' }],
        aboutYourself: profileData.aboutYourself || '',
      });
      setPosts(postsData);
      setConnections(connectionsData);

      // Fetch school if user has one
      if (profileData.schoolId) {
        const schoolData = await apiRequest(`/api/schools?id=${profileData.schoolId}`, { method: 'GET' });
        setSchool(schoolData);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      await apiRequest('/api/connections', {
        method: 'POST',
        body: JSON.stringify({
          requesterId: currentUser.userId,
          receiverId: parseInt(userId),
        }),
      });
      toast.success('Connection request sent!');
    } catch (error) {
      console.error('Failed to send connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  const handleSaveProfile = async () => {
    // Validate character limits
    if (editForm.bio.length > 250) {
      toast.error('Bio must be 250 characters or less');
      return;
    }
    if (editForm.aboutYourself.length > 1000) {
      toast.error('About Yourself must be 1000 characters or less');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await apiRequest(`/api/users?id=${userId}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setProfile(updated);
      setIsEditMode(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!selectedFile && !previewUrl) {
      toast.error('Please select an image file');
      return;
    }

    try {
      const field = showImageUpload === 'avatar' ? 'avatar' : 'coverImage';
      
      // For demo purposes, we'll use the preview URL (base64)
      // In production, you'd upload to a storage service first
      await apiRequest(`/api/users?id=${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ [field]: previewUrl }),
      });
      
      // Refetch profile data to get latest from database
      await fetchProfile();
      
      setShowImageUpload(null);
      setSelectedFile(null);
      setPreviewUrl('');
      toast.success(`${showImageUpload === 'avatar' ? 'Profile' : 'Cover'} image updated!`);
    } catch (error) {
      console.error('Failed to update image:', error);
      toast.error('Failed to update image');
    }
  };

  const addSchoolHistory = () => {
    setEditForm({
      ...editForm,
      schoolHistory: [...editForm.schoolHistory, { schoolName: '', from: '', to: '' }],
    });
  };

  const removeSchoolHistory = (index: number) => {
    const newHistory = editForm.schoolHistory.filter((_, i) => i !== index);
    setEditForm({ ...editForm, schoolHistory: newHistory });
  };

  const updateSchoolHistory = (index: number, field: string, value: string) => {
    const newHistory = [...editForm.schoolHistory];
    newHistory[index] = { ...newHistory[index], [field]: value };
    setEditForm({ ...editForm, schoolHistory: newHistory });
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const isStudent = profile.role === 'STUDENT';

  return (
    <div className="space-y-6">
      {/* Cover Image */}
      <Card>
        <div className="relative h-48 bg-gradient-to-br from-[#854cf4] to-[#6b3cc9] rounded-t-xl overflow-hidden">
          {profile.coverImage && (
            <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
          )}
          {isOwnProfile && (
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-4 right-4"
              onClick={() => setShowImageUpload('cover')}
            >
              <Camera className="w-4 h-4 mr-2" />
              Edit Cover
            </Button>
          )}
        </div>
        <CardContent className="relative pt-0 pb-6">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 mb-6">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-card">
                <AvatarImage src={profile.avatar || ''} alt={profile.name} />
                <AvatarFallback className="text-2xl">{profile.name[0]}</AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full w-10 h-10"
                  onClick={() => setShowImageUpload('avatar')}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  {isEditMode ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-2xl font-bold font-poppins mb-2"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold font-poppins">{profile.name}</h1>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{profile.role}</Badge>
                    {school && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <SchoolIcon className="w-3 h-3" />
                        {school.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <>
                      {isEditMode ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditMode(false);
                              setEditForm({
                                name: profile.name,
                                bio: profile.bio || '',
                                currentTown: profile.currentTown || '',
                                phone: profile.phone || '',
                                socialMediaLinks: profile.socialMediaLinks || { instagram: '', twitter: '', linkedin: '' },
                                class: profile.class || '',
                                schoolHistory: profile.schoolHistory || [{ schoolName: '', from: '', to: '' }],
                                aboutYourself: profile.aboutYourself || '',
                              });
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            Save
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => setIsEditMode(true)}
                            className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => router.push('/settings')}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit in Settings
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Button 
                        onClick={handleConnect}
                        className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                      <Button variant="outline">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {isEditMode ? (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Bio</label>
                <span className="text-xs text-muted-foreground">
                  {editForm.bio.length}/250 characters
                </span>
              </div>
              <Textarea
                value={editForm.bio}
                onChange={(e) => {
                  if (e.target.value.length <= 250) {
                    setEditForm({ ...editForm, bio: e.target.value });
                  }
                }}
                placeholder="Write a short bio..."
                rows={2}
                maxLength={250}
              />
            </div>
          ) : profile.bio ? (
            <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>
          ) : isOwnProfile ? (
            <p className="text-sm text-muted-foreground mb-4 italic">Add a bio to tell people about yourself</p>
          ) : null}

          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-semibold">{connections.length}</span>
              <span className="text-muted-foreground ml-1">Connections</span>
            </div>
            <div>
              <span className="font-semibold">{posts.length}</span>
              <span className="text-muted-foreground ml-1">Posts</span>
            </div>
            <div>
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="materials">Study Materials</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">About</h3>
              
              {isEditMode && isStudent ? (
                <div className="space-y-4">
                  {/* Current Town */}
                  <div className="space-y-2">
                    <Label>Current Town</Label>
                    <Input
                      value={editForm.currentTown}
                      onChange={(e) => setEditForm({ ...editForm, currentTown: e.target.value })}
                      placeholder="e.g., Mumbai"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="e.g., +91 98765 43210"
                    />
                  </div>

                  {/* Class */}
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Input
                      value={editForm.class}
                      onChange={(e) => setEditForm({ ...editForm, class: e.target.value })}
                      placeholder="e.g., Class 10 / Year 2"
                    />
                  </div>

                  {/* Social Media Links */}
                  <div className="space-y-2">
                    <Label>Social Media Links</Label>
                    <div className="space-y-2">
                      <Input
                        value={editForm.socialMediaLinks.instagram || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          socialMediaLinks: { ...editForm.socialMediaLinks, instagram: e.target.value }
                        })}
                        placeholder="Instagram username or URL"
                      />
                      <Input
                        value={editForm.socialMediaLinks.twitter || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          socialMediaLinks: { ...editForm.socialMediaLinks, twitter: e.target.value }
                        })}
                        placeholder="Twitter/X username or URL"
                      />
                      <Input
                        value={editForm.socialMediaLinks.linkedin || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          socialMediaLinks: { ...editForm.socialMediaLinks, linkedin: e.target.value }
                        })}
                        placeholder="LinkedIn profile URL"
                      />
                    </div>
                  </div>

                  {/* School History */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>School History</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addSchoolHistory}
                      >
                        Add School
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {editForm.schoolHistory.map((school, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">School {index + 1}</span>
                            {editForm.schoolHistory.length > 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeSchoolHistory(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <Input
                            value={school.schoolName}
                            onChange={(e) => updateSchoolHistory(index, 'schoolName', e.target.value)}
                            placeholder="School Name"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={school.from}
                              onChange={(e) => updateSchoolHistory(index, 'from', e.target.value)}
                              placeholder="From (e.g., 2020)"
                            />
                            <Input
                              value={school.to}
                              onChange={(e) => updateSchoolHistory(index, 'to', e.target.value)}
                              placeholder="To (e.g., 2024)"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* About Yourself */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>About Yourself</Label>
                      <span className="text-xs text-muted-foreground">
                        {editForm.aboutYourself.length}/1000 characters
                      </span>
                    </div>
                    <Textarea
                      value={editForm.aboutYourself}
                      onChange={(e) => {
                        if (e.target.value.length <= 1000) {
                          setEditForm({ ...editForm, aboutYourself: e.target.value });
                        }
                      }}
                      placeholder="Tell us more about yourself, your interests, goals, and aspirations..."
                      rows={6}
                      maxLength={1000}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                  
                  {isStudent && profile.currentTown && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.currentTown}</span>
                    </div>
                  )}
                  
                  {isStudent && profile.phone && (
                    <div className="flex items-center gap-3">
                      <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  
                  {isStudent && profile.class && (
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.class}</span>
                    </div>
                  )}
                  
                  {school && (
                    <div className="flex items-center gap-3">
                      <SchoolIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{school.name}</span>
                    </div>
                  )}
                  
                  {isStudent && profile.socialMediaLinks && (
                    <div className="space-y-2 pt-2">
                      <h4 className="font-medium text-xs text-muted-foreground uppercase">Social Media</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.socialMediaLinks.instagram && (
                          <a
                            href={profile.socialMediaLinks.instagram.startsWith('http') 
                              ? profile.socialMediaLinks.instagram 
                              : `https://instagram.com/${profile.socialMediaLinks.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#854cf4] hover:underline"
                          >
                            <LinkIcon className="w-3 h-3" />
                            Instagram
                          </a>
                        )}
                        {profile.socialMediaLinks.twitter && (
                          <a
                            href={profile.socialMediaLinks.twitter.startsWith('http') 
                              ? profile.socialMediaLinks.twitter 
                              : `https://twitter.com/${profile.socialMediaLinks.twitter}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#854cf4] hover:underline"
                          >
                            <LinkIcon className="w-3 h-3" />
                            Twitter
                          </a>
                        )}
                        {profile.socialMediaLinks.linkedin && (
                          <a
                            href={profile.socialMediaLinks.linkedin.startsWith('http') 
                              ? profile.socialMediaLinks.linkedin 
                              : `https://linkedin.com/in/${profile.socialMediaLinks.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#854cf4] hover:underline"
                          >
                            <LinkIcon className="w-3 h-3" />
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {isStudent && profile.schoolHistory && profile.schoolHistory.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="font-medium text-xs text-muted-foreground uppercase">School History</h4>
                      {profile.schoolHistory.map((school: any, index: number) => (
                        school.schoolName && (
                          <div key={index} className="flex items-start gap-3 pl-1">
                            <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">{school.schoolName}</p>
                              {(school.from || school.to) && (
                                <p className="text-xs text-muted-foreground">
                                  {school.from} - {school.to || 'Present'}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                  
                  {isStudent && profile.aboutYourself && (
                    <div className="space-y-2 pt-4 border-t">
                      <h4 className="font-medium text-xs text-muted-foreground uppercase">About</h4>
                      <p className="text-sm whitespace-pre-wrap">{profile.aboutYourself}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <div className="space-y-4">
            <h3 className="font-semibold">Recent Posts</h3>
            {posts.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No posts yet
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          {posts.filter(p => p.type === 'STUDY_MATERIAL').length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No study materials shared yet
              </CardContent>
            </Card>
          ) : (
            posts
              .filter(p => p.type === 'STUDY_MATERIAL')
              .map((post) => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {connections.map((connection) => (
              <ConnectionCard key={connection.id} connection={connection} currentUserId={parseInt(userId)} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Image Upload Dialog */}
      <Dialog open={showImageUpload !== null} onOpenChange={() => {
        setShowImageUpload(null);
        setSelectedFile(null);
        setPreviewUrl('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update {showImageUpload === 'avatar' ? 'Profile' : 'Cover'} Image
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Upload Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Select an image file (max 5MB, JPG/PNG/GIF)
              </p>
            </div>
            {previewUrl && (
              <div className="border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className={showImageUpload === 'avatar' ? 'w-32 h-32 rounded-full object-cover' : 'w-full h-48 rounded-lg object-cover'}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowImageUpload(null);
              setSelectedFile(null);
              setPreviewUrl('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleImageUpload}
              disabled={!selectedFile && !previewUrl}
              className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
            >
              Update Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <Skeleton className="h-48 rounded-t-xl" />
        <CardContent className="pt-0 pb-6">
          <div className="flex items-end gap-4 -mt-16 mb-6">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConnectionCard({ connection, currentUserId }: { connection: any; currentUserId: number }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUser();
  }, [connection]);

  const fetchUser = async () => {
    try {
      const userId = connection.requesterId === currentUserId 
        ? connection.receiverId 
        : connection.requesterId;
      const data = await apiRequest(`/api/users?id=${userId}`, { method: 'GET' });
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar || ''} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{user.name}</p>
            <Badge variant="secondary" className="text-xs">{user.role}</Badge>
          </div>
          <Button size="sm" variant="outline">
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}