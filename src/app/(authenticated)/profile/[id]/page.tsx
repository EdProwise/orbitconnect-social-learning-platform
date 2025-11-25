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
  Instagram,
  Twitter,
  Linkedin,
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
  const [isAboutEditMode, setIsAboutEditMode] = useState(false);
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
  const [aboutEditForm, setAboutEditForm] = useState({
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
  const isOwnProfile = currentUser.id === parseInt(userId);

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
      setAboutEditForm({
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
          requesterId: currentUser.id,
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

  const handleSaveAbout = async () => {
    if (aboutEditForm.aboutYourself.length > 1000) {
      toast.error('About Yourself must be 1000 characters or less');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await apiRequest(`/api/users?id=${userId}`, {
        method: 'PUT',
        body: JSON.stringify(aboutEditForm),
      });
      setProfile(updated);
      setIsAboutEditMode(false);
      toast.success('About section updated successfully!');
    } catch (error) {
      console.error('Failed to update about section:', error);
      toast.error('Failed to update about section');
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

  const addSchoolHistoryAbout = () => {
    setAboutEditForm({
      ...aboutEditForm,
      schoolHistory: [...aboutEditForm.schoolHistory, { schoolName: '', from: '', to: '' }],
    });
  };

  const removeSchoolHistoryAbout = (index: number) => {
    const newHistory = aboutEditForm.schoolHistory.filter((_, i) => i !== index);
    setAboutEditForm({ ...aboutEditForm, schoolHistory: newHistory });
  };

  const updateSchoolHistoryAbout = (index: number, field: string, value: string) => {
    const newHistory = [...aboutEditForm.schoolHistory];
    newHistory[index] = { ...newHistory[index], [field]: value };
    setAboutEditForm({ ...aboutEditForm, schoolHistory: newHistory });
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="materials">Study Materials</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Redesigned About Card */}
          <Card className="shadow-sm border-border/50">
            <CardContent className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold font-poppins">About</h3>
                {isOwnProfile && !isAboutEditMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsAboutEditMode(true)}
                    className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {isAboutEditMode && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAboutEditMode(false);
                        setAboutEditForm({
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
                      size="sm"
                      onClick={handleSaveAbout}
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
                  </div>
                )}
              </div>

              {isAboutEditMode && isStudent ? (
                <div className="space-y-6">
                  {/* Contact Information Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Information</h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#854cf4]" />
                          Location
                        </Label>
                        <Input
                          value={aboutEditForm.currentTown}
                          onChange={(e) => setAboutEditForm({ ...aboutEditForm, currentTown: e.target.value })}
                          placeholder="e.g., Mumbai, India"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <PhoneIcon className="w-4 h-4 text-[#854cf4]" />
                          Phone Number
                        </Label>
                        <Input
                          value={aboutEditForm.phone}
                          onChange={(e) => setAboutEditForm({ ...aboutEditForm, phone: e.target.value })}
                          placeholder="e.g., +91 98765 43210"
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50" />

                  {/* Education Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Education</h4>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#854cf4]" />
                        Current Class
                      </Label>
                      <Input
                        value={aboutEditForm.class}
                        onChange={(e) => setAboutEditForm({ ...aboutEditForm, class: e.target.value })}
                        placeholder="e.g., Class 10 / Year 2"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-[#854cf4]" />
                          School History
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addSchoolHistoryAbout}
                          className="h-8 text-xs"
                        >
                          + Add School
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {aboutEditForm.schoolHistory.map((school, index) => (
                          <div key={index} className="p-4 bg-muted/30 rounded-xl space-y-3 border border-border/50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">School {index + 1}</span>
                              {aboutEditForm.schoolHistory.length > 1 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeSchoolHistoryAbout(index)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <Input
                              value={school.schoolName}
                              onChange={(e) => updateSchoolHistoryAbout(index, 'schoolName', e.target.value)}
                              placeholder="School Name"
                              className="h-11"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                value={school.from}
                                onChange={(e) => updateSchoolHistoryAbout(index, 'from', e.target.value)}
                                placeholder="From (e.g., 2020)"
                                className="h-11"
                              />
                              <Input
                                value={school.to}
                                onChange={(e) => updateSchoolHistoryAbout(index, 'to', e.target.value)}
                                placeholder="To (e.g., 2024)"
                                className="h-11"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50" />

                  {/* Social Media Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Social Links</h4>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-[#854cf4]" />
                          Instagram
                        </Label>
                        <Input
                          value={aboutEditForm.socialMediaLinks.instagram || ''}
                          onChange={(e) => setAboutEditForm({
                            ...aboutEditForm,
                            socialMediaLinks: { ...aboutEditForm.socialMediaLinks, instagram: e.target.value }
                          })}
                          placeholder="username or full URL"
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Twitter className="w-4 h-4 text-[#854cf4]" />
                          Twitter / X
                        </Label>
                        <Input
                          value={aboutEditForm.socialMediaLinks.twitter || ''}
                          onChange={(e) => setAboutEditForm({
                            ...aboutEditForm,
                            socialMediaLinks: { ...aboutEditForm.socialMediaLinks, twitter: e.target.value }
                          })}
                          placeholder="username or full URL"
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Linkedin className="w-4 h-4 text-[#854cf4]" />
                          LinkedIn
                        </Label>
                        <Input
                          value={aboutEditForm.socialMediaLinks.linkedin || ''}
                          onChange={(e) => setAboutEditForm({
                            ...aboutEditForm,
                            socialMediaLinks: { ...aboutEditForm.socialMediaLinks, linkedin: e.target.value }
                          })}
                          placeholder="profile URL"
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50" />

                  {/* About Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">About Yourself</Label>
                      <span className="text-xs text-muted-foreground">
                        {aboutEditForm.aboutYourself.length}/1000
                      </span>
                    </div>
                    <Textarea
                      value={aboutEditForm.aboutYourself}
                      onChange={(e) => {
                        if (e.target.value.length <= 1000) {
                          setAboutEditForm({ ...aboutEditForm, aboutYourself: e.target.value });
                        }
                      }}
                      placeholder="Tell us more about yourself, your interests, goals, and aspirations..."
                      rows={6}
                      maxLength={1000}
                      className="resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Contact Information */}
                  {(profile.email || (isStudent && (profile.currentTown || profile.phone))) && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Information</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                          <Mail className="w-5 h-5 text-[#854cf4] flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                            <p className="text-sm font-medium truncate">{profile.email}</p>
                          </div>
                        </div>
                        
                        {isStudent && profile.currentTown && (
                          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                            <MapPin className="w-5 h-5 text-[#854cf4] flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                              <p className="text-sm font-medium truncate">{profile.currentTown}</p>
                            </div>
                          </div>
                        )}
                        
                        {isStudent && profile.phone && (
                          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                            <PhoneIcon className="w-5 h-5 text-[#854cf4] flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                              <p className="text-sm font-medium">{profile.phone}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {(profile.email || (isStudent && (profile.currentTown || profile.phone))) && (isStudent && (profile.class || school)) && (
                    <div className="border-t border-border/50" />
                  )}

                  {/* Education */}
                  {isStudent && (profile.class || school) && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Education</h4>
                      <div className="space-y-2">
                        {profile.class && (
                          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                            <GraduationCap className="w-5 h-5 text-[#854cf4] flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Current Class</p>
                              <p className="text-sm font-medium">{profile.class}</p>
                            </div>
                          </div>
                        )}
                        
                        {school && (
                          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                            <SchoolIcon className="w-5 h-5 text-[#854cf4] flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">School / Institution</p>
                              <p className="text-sm font-medium">{school.name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {isStudent && profile.schoolHistory && profile.schoolHistory.length > 0 && profile.schoolHistory.some((s: any) => s.schoolName) && (
                    <>
                      <div className="border-t border-border/50" />
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">School History</h4>
                        <div className="space-y-2">
                          {profile.schoolHistory.map((school: any, index: number) => (
                            school.schoolName && (
                              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                                <Briefcase className="w-5 h-5 text-[#854cf4] flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{school.schoolName}</p>
                                  {(school.from || school.to) && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {school.from} - {school.to || 'Present'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {isStudent && profile.socialMediaLinks && (profile.socialMediaLinks.instagram || profile.socialMediaLinks.twitter || profile.socialMediaLinks.linkedin) && (
                    <>
                      <div className="border-t border-border/50" />
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Social Links</h4>
                        <div className="flex flex-wrap gap-3">
                          {profile.socialMediaLinks.instagram && (
                            <a
                              href={profile.socialMediaLinks.instagram.startsWith('http') 
                                ? profile.socialMediaLinks.instagram 
                                : `https://instagram.com/${profile.socialMediaLinks.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/50 hover:border-[#854cf4] hover:bg-[#854cf4]/5 transition-all"
                            >
                              <Instagram className="w-4 h-4 text-[#854cf4]" />
                              <span className="text-sm font-medium">Instagram</span>
                            </a>
                          )}
                          {profile.socialMediaLinks.twitter && (
                            <a
                              href={profile.socialMediaLinks.twitter.startsWith('http') 
                                ? profile.socialMediaLinks.twitter 
                                : `https://twitter.com/${profile.socialMediaLinks.twitter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/50 hover:border-[#854cf4] hover:bg-[#854cf4]/5 transition-all"
                            >
                              <Twitter className="w-4 h-4 text-[#854cf4]" />
                              <span className="text-sm font-medium">Twitter</span>
                            </a>
                          )}
                          {profile.socialMediaLinks.linkedin && (
                            <a
                              href={profile.socialMediaLinks.linkedin.startsWith('http') 
                                ? profile.socialMediaLinks.linkedin 
                                : `https://linkedin.com/in/${profile.socialMediaLinks.linkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/50 hover:border-[#854cf4] hover:bg-[#854cf4]/5 transition-all"
                            >
                              <Linkedin className="w-4 h-4 text-[#854cf4]" />
                              <span className="text-sm font-medium">LinkedIn</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {isStudent && profile.aboutYourself && (
                    <>
                      <div className="border-t border-border/50" />
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">About</h4>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{profile.aboutYourself}</p>
                      </div>
                    </>
                  )}

                  {!isStudent && (
                    <p className="text-sm text-muted-foreground italic">No additional information available</p>
                  )}

                  {isOwnProfile && isStudent && !profile.currentTown && !profile.phone && !profile.class && !profile.aboutYourself && (!profile.socialMediaLinks || (!profile.socialMediaLinks.instagram && !profile.socialMediaLinks.twitter && !profile.socialMediaLinks.linkedin)) && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground mb-4">Complete your profile to help others know you better</p>
                      <Button
                        size="sm"
                        onClick={() => setIsAboutEditMode(true)}
                        className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Add Information
                      </Button>
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