'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Home,
  Heart,
  User,
  Info,
  Sparkles,
  Globe,
  MoreHorizontal,
  Award,
  BookOpen,
  UserCheck,
  UserMinus,
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
  teachingExperience?: Array<{ schoolName: string; designation: string; teachingLevel: string; from: string; to: string }> | null;
  skills?: string[] | null;
  teachingSubjects?: string[] | null;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [aboutActiveSection, setAboutActiveSection] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAboutEditMode, setIsAboutEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    schoolId: null as number | null,
    currentTown: '',
    phone: '',
    socialMediaLinks: { instagram: '', twitter: '', linkedin: '' },
    class: '',
    schoolHistory: [{ schoolName: '', from: '', to: '' }],
    aboutYourself: '',
  });
  const [aboutEditForm, setAboutEditForm] = useState({
    schoolId: null as number | null,
    currentTown: '',
    phone: '',
    socialMediaLinks: { instagram: '', twitter: '', linkedin: '' },
    class: '',
    schoolHistory: [{ schoolName: '', from: '', to: '' }],
    aboutYourself: '',
    teachingExperience: [{ schoolName: '', designation: '', teachingLevel: '', from: '', to: '' }],
    skills: [''],
    teachingSubjects: [''],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState<'avatar' | 'cover' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Get current user
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const isOwnProfile = currentUser.id === parseInt(userId);
  const isTeacher = profile?.role === 'TEACHER';

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchSchools();
      if (profile?.role === 'TEACHER') {
        fetchFollowStats();
      }
    }
  }, [userId, profile?.role]);

  const fetchSchools = async () => {
    try {
      const schoolsData = await apiRequest('/api/schools?limit=100', { method: 'GET' });
      setSchools(schoolsData);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  };

  const fetchFollowStats = async () => {
    try {
      const [followersData, followStatusData] = await Promise.all([
        apiRequest(`/api/follows?followingId=${userId}`, { method: 'GET' }),
        !isOwnProfile ? apiRequest(`/api/follows/status?followerId=${currentUser.id}&followingId=${userId}`, { method: 'GET' }) : Promise.resolve({ isFollowing: false }),
      ]);
      setFollowerCount(followersData.length || 0);
      setIsFollowing(followStatusData.isFollowing || false);
    } catch (error) {
      console.error('Failed to fetch follow stats:', error);
    }
  };

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
        schoolId: profileData.schoolId || null,
        currentTown: profileData.currentTown || '',
        phone: profileData.phone || '',
        socialMediaLinks: profileData.socialMediaLinks || { instagram: '', twitter: '', linkedin: '' },
        class: profileData.class || '',
        schoolHistory: profileData.schoolHistory || [{ schoolName: '', from: '', to: '' }],
        aboutYourself: profileData.aboutYourself || '',
      });
      setAboutEditForm({
        schoolId: profileData.schoolId || null,
        currentTown: profileData.currentTown || '',
        phone: profileData.phone || '',
        socialMediaLinks: profileData.socialMediaLinks || { instagram: '', twitter: '', linkedin: '' },
        class: profileData.class || '',
        schoolHistory: profileData.schoolHistory || [{ schoolName: '', from: '', to: '' }],
        aboutYourself: profileData.aboutYourself || '',
        teachingExperience: profileData.teachingExperience || [{ schoolName: '', designation: '', teachingLevel: '', from: '', to: '' }],
        skills: profileData.skills || [''],
        teachingSubjects: profileData.teachingSubjects || [''],
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

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await apiRequest(`/api/follows?followerId=${currentUser.id}&followingId=${userId}`, {
          method: 'DELETE',
        });
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
        toast.success('Unfollowed teacher');
      } else {
        await apiRequest('/api/follows', {
          method: 'POST',
          body: JSON.stringify({
            followerId: currentUser.id,
            followingId: parseInt(userId),
          }),
        });
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast.success('Following teacher');
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
      toast.error('Failed to update follow status');
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
      
      // Refetch to update school info
      await fetchProfile();
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
      
      // For teachers, use PATCH to update teacher-specific fields
      if (isTeacher) {
        // Update basic fields with PUT
        await apiRequest(`/api/users?id=${userId}`, {
          method: 'PUT',
          body: JSON.stringify({
            schoolId: aboutEditForm.schoolId,
            currentTown: aboutEditForm.currentTown,
            phone: aboutEditForm.phone,
            socialMediaLinks: aboutEditForm.socialMediaLinks,
            aboutYourself: aboutEditForm.aboutYourself,
          }),
        });
        
        // Update teacher-specific fields with PATCH
        const cleanedTeachingExperience = aboutEditForm.teachingExperience.filter(exp => exp.schoolName && exp.designation && exp.teachingLevel);
        const cleanedSkills = aboutEditForm.skills.filter(skill => skill.trim() !== '');
        const cleanedSubjects = aboutEditForm.teachingSubjects.filter(subject => subject.trim() !== '');
        
        await apiRequest(`/api/users?id=${userId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            teachingExperience: cleanedTeachingExperience.length > 0 ? cleanedTeachingExperience : null,
            skills: cleanedSkills.length > 0 ? cleanedSkills : null,
            teachingSubjects: cleanedSubjects.length > 0 ? cleanedSubjects : null,
          }),
        });
      } else {
        // For students, use PUT
        await apiRequest(`/api/users?id=${userId}`, {
          method: 'PUT',
          body: JSON.stringify(aboutEditForm),
        });
      }
      
      setIsAboutEditMode(false);
      toast.success('About section updated successfully!');
      
      // Refetch to update profile data
      await fetchProfile();
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

  // Teacher-specific helper functions
  const addTeachingExperience = () => {
    setAboutEditForm({
      ...aboutEditForm,
      teachingExperience: [...aboutEditForm.teachingExperience, { schoolName: '', designation: '', teachingLevel: '', from: '', to: '' }],
    });
  };

  const removeTeachingExperience = (index: number) => {
    const newExperience = aboutEditForm.teachingExperience.filter((_, i) => i !== index);
    setAboutEditForm({ ...aboutEditForm, teachingExperience: newExperience });
  };

  const updateTeachingExperience = (index: number, field: string, value: string) => {
    const newExperience = [...aboutEditForm.teachingExperience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    setAboutEditForm({ ...aboutEditForm, teachingExperience: newExperience });
  };

  const addSkill = () => {
    setAboutEditForm({
      ...aboutEditForm,
      skills: [...aboutEditForm.skills, ''],
    });
  };

  const removeSkill = (index: number) => {
    const newSkills = aboutEditForm.skills.filter((_, i) => i !== index);
    setAboutEditForm({ ...aboutEditForm, skills: newSkills });
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...aboutEditForm.skills];
    newSkills[index] = value;
    setAboutEditForm({ ...aboutEditForm, skills: newSkills });
  };

  const addSubject = () => {
    setAboutEditForm({
      ...aboutEditForm,
      teachingSubjects: [...aboutEditForm.teachingSubjects, ''],
    });
  };

  const removeSubject = (index: number) => {
    const newSubjects = aboutEditForm.teachingSubjects.filter((_, i) => i !== index);
    setAboutEditForm({ ...aboutEditForm, teachingSubjects: newSubjects });
  };

  const updateSubject = (index: number, value: string) => {
    const newSubjects = [...aboutEditForm.teachingSubjects];
    newSubjects[index] = value;
    setAboutEditForm({ ...aboutEditForm, teachingSubjects: newSubjects });
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
                                schoolId: profile.schoolId || null,
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
                      {isTeacher ? (
                        <Button 
                          onClick={handleFollow}
                          className={isFollowing ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'bg-[#854cf4] hover:bg-[#7743e0] text-white'}
                        >
                          {isFollowing ? (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Following
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Follow
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleConnect}
                          className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      )}
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
            <div className="space-y-4 mb-4">
              <div className="space-y-2">
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

              {isStudent && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assigned School</label>
                  <Select
                    value={editForm.schoolId?.toString() || 'none'}
                    onValueChange={(value) => setEditForm({ ...editForm, schoolId: value === 'none' ? null : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No school assigned</SelectItem>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This is your current assigned school shown in your profile
                  </p>
                </div>
              )}
            </div>
          ) : profile.bio ? (
            <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>
          ) : isOwnProfile ? (
            <p className="text-sm text-muted-foreground mb-4 italic">Add a bio to tell people about yourself</p>
          ) : null}

          {/* Stats */}
          <div className="flex gap-6 text-sm">
            {isTeacher ? (
              <>
                <div>
                  <span className="font-semibold">{followerCount}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-semibold">{posts.length}</span>
                  <span className="text-muted-foreground ml-1">Posts</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="font-semibold">{connections.length}</span>
                  <span className="text-muted-foreground ml-1">Connections</span>
                </div>
                <div>
                  <span className="font-semibold">{posts.length}</span>
                  <span className="text-muted-foreground ml-1">Posts</span>
                </div>
              </>
            )}
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
          {isTeacher && <TabsTrigger value="experience">Experience</TabsTrigger>}
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="materials">Study Materials</TabsTrigger>
          {!isTeacher && <TabsTrigger value="connections">Connections</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* LinkedIn-Style About Card with Sidebar */}
          <Card className="overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Left Sidebar Navigation */}
              <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-border bg-muted/20 p-6">
                <h2 className="text-xl font-semibold font-poppins mb-6">About</h2>
                <nav className="space-y-1">
                  <button
                    onClick={() => setAboutActiveSection('overview')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      aboutActiveSection === 'overview'
                        ? 'bg-primary/10 text-[#854cf4]'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    Overview
                  </button>
                  {isStudent && (
                    <>
                      <button
                        onClick={() => setAboutActiveSection('education')}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          aboutActiveSection === 'education'
                            ? 'bg-primary/10 text-[#854cf4]'
                            : 'text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        Work and education
                      </button>
                      <button
                        onClick={() => setAboutActiveSection('location')}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          aboutActiveSection === 'location'
                            ? 'bg-primary/10 text-[#854cf4]'
                            : 'text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        Places lived
                      </button>
                      <button
                        onClick={() => setAboutActiveSection('contact')}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          aboutActiveSection === 'contact'
                            ? 'bg-primary/10 text-[#854cf4]'
                            : 'text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        Contact and basic info
                      </button>
                      <button
                        onClick={() => setAboutActiveSection('details')}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          aboutActiveSection === 'details'
                            ? 'bg-primary/10 text-[#854cf4]'
                            : 'text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        Details about you
                      </button>
                    </>
                  )}
                </nav>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-semibold font-poppins capitalize">
                    {aboutActiveSection === 'overview' && 'Overview'}
                    {aboutActiveSection === 'education' && 'Work and education'}
                    {aboutActiveSection === 'location' && 'Places lived'}
                    {aboutActiveSection === 'contact' && 'Contact and basic info'}
                    {aboutActiveSection === 'details' && 'Details about you'}
                  </h3>
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
                            schoolId: profile.schoolId || null,
                            currentTown: profile.currentTown || '',
                            phone: profile.phone || '',
                            socialMediaLinks: profile.socialMediaLinks || { instagram: '', twitter: '', linkedin: '' },
                            class: profile.class || '',
                            schoolHistory: profile.schoolHistory || [{ schoolName: '', from: '', to: '' }],
                            aboutYourself: profile.aboutYourself || '',
                            teachingExperience: profile.teachingExperience || [{ schoolName: '', designation: '', teachingLevel: '', from: '', to: '' }],
                            skills: profile.skills || [''],
                            teachingSubjects: profile.teachingSubjects || [''],
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

                {/* Overview Section */}
                {aboutActiveSection === 'overview' && (
                  <div className="space-y-4">
                    {/* Bio Section */}
                    {profile.bio && (
                      <div className="flex items-start gap-4 py-3 hover:bg-muted/30 rounded-lg px-3 -mx-3 transition-colors">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-5 h-5 text-[#854cf4]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-1">Bio</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    )}

                    {isStudent && school && (
                      <div className="flex items-start gap-4 py-3 hover:bg-muted/30 rounded-lg px-3 -mx-3 transition-colors">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                          <Briefcase className="w-5 h-5 text-[#854cf4]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {profile.role === 'STUDENT' ? 'Student' : profile.role} at{' '}
                            <Link 
                              href={`/schools/${school.slug}`}
                              className="font-semibold text-[#854cf4] hover:underline"
                            >
                              {school.name}
                            </Link>
                          </p>
                          {profile.class && (
                            <p className="text-sm text-muted-foreground mt-0.5">Current: {profile.class}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    )}

                    {isStudent && profile.currentTown && (
                      <div className="flex items-start gap-4 py-3 hover:bg-muted/30 rounded-lg px-3 -mx-3 transition-colors">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                          <Home className="w-5 h-5 text-[#854cf4]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            Lives in <span className="font-semibold">{profile.currentTown}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    )}

                    {isStudent && profile.phone && (
                      <div className="flex items-start gap-4 py-3 hover:bg-muted/30 rounded-lg px-3 -mx-3 transition-colors">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                          <PhoneIcon className="w-5 h-5 text-[#854cf4]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{profile.phone}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">Mobile</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    )}

                    {!isStudent && (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">No information available</p>
                      </div>
                    )}

                    {isOwnProfile && isStudent && !profile.bio && !school && !profile.currentTown && !profile.phone && (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground mb-4">Add information to help others know you better</p>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => setIsAboutEditMode(true)}
                            className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Add Information
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push('/settings')}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit in Settings
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Work and Education Section */}
                {aboutActiveSection === 'education' && isStudent && (
                  <div className="space-y-6">
                    {isAboutEditMode ? (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Assigned School</Label>
                          <Select
                            value={aboutEditForm.schoolId?.toString() || 'none'}
                            onValueChange={(value) => setAboutEditForm({ ...aboutEditForm, schoolId: value === 'none' ? null : parseInt(value) })}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select a school" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No school assigned</SelectItem>
                              {schools.map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            This is your current assigned school shown in your profile
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Current Class</Label>
                          <Input
                            value={aboutEditForm.class}
                            onChange={(e) => setAboutEditForm({ ...aboutEditForm, class: e.target.value })}
                            placeholder="e.g., Class 10 / Year 2"
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">School History</Label>
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
                      </>
                    ) : (
                      <div className="space-y-4">
                        {school && (
                          <div className="flex items-start gap-4 py-3 hover:bg-muted/30 rounded-lg px-3 -mx-3 transition-colors">
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                              <SchoolIcon className="w-5 h-5 text-[#854cf4]" />
                            </div>
                            <div className="flex-1">
                              <Link 
                                href={`/schools/${school.slug}`}
                                className="text-sm font-semibold text-[#854cf4] hover:underline"
                              >
                                {school.name}
                              </Link>
                              {profile.class && (
                                <p className="text-sm text-muted-foreground mt-0.5">{profile.class}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                        )}

                        {profile.schoolHistory && profile.schoolHistory.map((school: any, index: number) => (
                          school.schoolName && (
                            <div key={index} className="flex items-start gap-4 py-3 hover:bg-muted/30 rounded-lg px-3 -mx-3 transition-colors">
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                                <GraduationCap className="w-5 h-5 text-[#854cf4]" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold">{school.schoolName}</p>
                                {(school.from || school.to) && (
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {school.from} - {school.to || 'Present'}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                                  <Globe className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                </button>
                              </div>
                            </div>
                          )
                        ))}

                        {!school && (!profile.schoolHistory || !profile.schoolHistory.some((s: any) => s.schoolName)) && (
                          <div className="py-12 text-center">
                            <p className="text-sm text-muted-foreground mb-4">No education information added yet</p>
                            {isOwnProfile && (
                              <Button
                                size="sm"
                                onClick={() => setIsAboutEditMode(true)}
                                className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                              >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Add Education
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Places Lived Section */}
                {aboutActiveSection === 'location' && isStudent && (
                  <div className="space-y-4">
                    {isAboutEditMode ? (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Current Town/City</Label>
                        <Input
                          value={aboutEditForm.currentTown}
                          onChange={(e) => setAboutEditForm({ ...aboutEditForm, currentTown: e.target.value })}
                          placeholder="e.g., Mumbai, India"
                          className="h-11"
                        />
                      </div>
                    ) : profile.currentTown ? (
                      <div className="flex items-start gap-4 py-3 hover:bg-muted/30 rounded-lg px-3 -mx-3 transition-colors">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                          <Home className="w-5 h-5 text-[#854cf4]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Lives in <span className="font-semibold">{profile.currentTown}</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground mb-4">No location information added yet</p>
                        {isOwnProfile && (
                          <Button
                            size="sm"
                            onClick={() => setIsAboutEditMode(true)}
                            className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Add Location
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Contact and Basic Info Section */}
                {aboutActiveSection === 'contact' && isStudent && (
                  <div className="space-y-4">
                    {isAboutEditMode ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Phone Number</Label>
                          <Input
                            value={aboutEditForm.phone}
                            onChange={(e) => setAboutEditForm({ ...aboutEditForm, phone: e.target.value })}
                            placeholder="e.g., +91 98765 43210"
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Social Links</Label>
                          
                          <div className="space-y-2">
                            <Input
                              value={aboutEditForm.socialMediaLinks.instagram || ''}
                              onChange={(e) => setAboutEditForm({
                                ...aboutEditForm,
                                socialMediaLinks: { ...aboutEditForm.socialMediaLinks, instagram: e.target.value }
                              })}
                              placeholder="Instagram username or URL"
                              className="h-11"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Input
                              value={aboutEditForm.socialMediaLinks.twitter || ''}
                              onChange={(e) => setAboutEditForm({
                                ...aboutEditForm,
                                socialMediaLinks: { ...aboutEditForm.socialMediaLinks, twitter: e.target.value }
                              })}
                              placeholder="Twitter username or URL"
                              className="h-11"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Input
                              value={aboutEditForm.socialMediaLinks.linkedin || ''}
                              onChange={(e) => setAboutEditForm({
                                ...aboutEditForm,
                                socialMediaLinks: { ...aboutEditForm.socialMediaLinks, linkedin: e.target.value }
                              })}
                              placeholder="LinkedIn profile URL"
                              className="h-11"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {profile.phone && (
                          <div className="flex items-start gap-4 py-3 hover:bg-muted/30 rounded-lg px-3 -mx-3 transition-colors">
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                              <PhoneIcon className="w-5 h-5 text-[#854cf4]" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{profile.phone}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">Mobile</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-4 py-3 hover:bg-muted/30 rounded-lg px-3 -mx-3 transition-colors">
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                            <Mail className="w-5 h-5 text-[#854cf4]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{profile.email}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">Email</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>

                        {profile.socialMediaLinks && (profile.socialMediaLinks.instagram || profile.socialMediaLinks.twitter || profile.socialMediaLinks.linkedin) && (
                          <div className="pt-4 border-t border-border">
                            <h4 className="text-sm font-medium mb-3">Social Links</h4>
                            <div className="space-y-2">
                              {profile.socialMediaLinks.instagram && (
                                <a
                                  href={profile.socialMediaLinks.instagram.startsWith('http') 
                                    ? profile.socialMediaLinks.instagram 
                                    : `https://instagram.com/${profile.socialMediaLinks.instagram}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                                >
                                  <Instagram className="w-5 h-5 text-[#854cf4]" />
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
                                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                                >
                                  <Twitter className="w-5 h-5 text-[#854cf4]" />
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
                                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                                >
                                  <Linkedin className="w-5 h-5 text-[#854cf4]" />
                                  <span className="text-sm font-medium">LinkedIn</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {!profile.phone && (!profile.socialMediaLinks || (!profile.socialMediaLinks.instagram && !profile.socialMediaLinks.twitter && !profile.socialMediaLinks.linkedin)) && (
                          <div className="py-12 text-center">
                            <p className="text-sm text-muted-foreground mb-4">No contact information added yet</p>
                            {isOwnProfile && (
                              <Button
                                size="sm"
                                onClick={() => setIsAboutEditMode(true)}
                                className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                              >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Add Contact Info
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Details About You Section */}
                {aboutActiveSection === 'details' && isStudent && (
                  <div className="space-y-4">
                    {isAboutEditMode ? (
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
                          rows={8}
                          maxLength={1000}
                          className="resize-none"
                        />
                      </div>
                    ) : profile.aboutYourself ? (
                      <div className="py-2">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{profile.aboutYourself}</p>
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground mb-4">Tell others about yourself</p>
                        {isOwnProfile && (
                          <Button
                            size="sm"
                            onClick={() => setIsAboutEditMode(true)}
                            className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Add Details
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Recent Posts */}
          <div className="space-y-4">
            <h3 className="font-semibold">Recent Posts</h3>
            {posts.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>

        {/* Teacher Experience Tab */}
        {isTeacher && (
          <TabsContent value="experience" className="space-y-4">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold mb-6">Teaching Experience</h3>
                
                {isAboutEditMode ? (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Teaching Experience</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addTeachingExperience}
                          className="h-8 text-xs"
                        >
                          + Add Experience
                        </Button>
                      </div>
                      
                      {aboutEditForm.teachingExperience.map((exp, index) => (
                        <div key={index} className="p-4 bg-muted/30 rounded-xl space-y-3 border border-border/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Experience {index + 1}</span>
                            {aboutEditForm.teachingExperience.length > 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeTeachingExperience(index)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">School Name</Label>
                              <Input
                                value={exp.schoolName}
                                onChange={(e) => updateTeachingExperience(index, 'schoolName', e.target.value)}
                                placeholder="School Name"
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Designation</Label>
                              <Input
                                value={exp.designation}
                                onChange={(e) => updateTeachingExperience(index, 'designation', e.target.value)}
                                placeholder="Designation"
                                className="h-11"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Teaching Level</Label>
                              <Input
                                value={exp.teachingLevel}
                                onChange={(e) => updateTeachingExperience(index, 'teachingLevel', e.target.value)}
                                placeholder="Teaching Level"
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">From</Label>
                              <Input
                                value={exp.from}
                                onChange={(e) => updateTeachingExperience(index, 'from', e.target.value)}
                                placeholder="From (e.g., 2020)"
                                className="h-11"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">To</Label>
                              <Input
                                value={exp.to}
                                onChange={(e) => updateTeachingExperience(index, 'to', e.target.value)}
                                placeholder="To (e.g., 2024)"
                                className="h-11"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.teachingExperience && profile.teachingExperience.map((exp: any, index: number) => (
                      <div key={index} className="flex items-start gap-4 py-3 hover:bg-muted/30 rounded-lg px-3 -mx-3 transition-colors">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                          <Award className="w-5 h-5 text-[#854cf4]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {exp.schoolName} - {exp.designation}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {exp.teachingLevel} at {exp.from} - {exp.to || 'Present'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {!profile.teachingExperience && (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground mb-4">No teaching experience added yet</p>
                        {isOwnProfile && (
                          <Button
                            size="sm"
                            onClick={() => setIsAboutEditMode(true)}
                            className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Add Teaching Experience
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <h3 className="text-lg font-semibold mt-8 mb-6">Skills</h3>
                
                {isAboutEditMode ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Skills</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addSkill}
                        className="h-8 text-xs"
                      >
                        + Add Skill
                      </Button>
                    </div>
                    
                    {aboutEditForm.skills.map((skill, index) => (
                      <div key={index} className="p-4 bg-muted/30 rounded-xl space-y-3 border border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Skill {index + 1}</span>
                          {aboutEditForm.skills.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeSkill(index)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={skill}
                          onChange={(e) => updateSkill(index, e.target.value)}
                          placeholder="Skill name"
                          className="h-11"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.skills && profile.skills.map((skill: string, index: number) => (
                      <div key={index} className="flex items-start gap-4 py-3 hover:bg-muted/30 rounded-lg px-3 -mx-3 transition-colors">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                          <BookOpen className="w-5 h-5 text-[#854cf4]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{skill}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {!profile.skills && (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground mb-4">No skills added yet</p>
                        {isOwnProfile && (
                          <Button
                            size="sm"
                            onClick={() => setIsAboutEditMode(true)}
                            className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Add Skills
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <h3 className="text-lg font-semibold mt-8 mb-6">Teaching Subjects</h3>
                
                {isAboutEditMode ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Teaching Subjects</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addSubject}
                        className="h-8 text-xs"
                      >
                        + Add Subject
                      </Button>
                    </div>
                    
                    {aboutEditForm.teachingSubjects.map((subject, index) => (
                      <div key={index} className="p-4 bg-muted/30 rounded-xl space-y-3 border border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Subject {index + 1}</span>
                          {aboutEditForm.teachingSubjects.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeSubject(index)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={subject}
                          onChange={(e) => updateSubject(index, e.target.value)}
                          placeholder="Subject name"
                          className="h-11"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.teachingSubjects && profile.teachingSubjects.map((subject: string, index: number) => (
                      <div key={index} className="flex items-start gap-4 py-3 hover:bg-muted/30 rounded-lg px-3 -mx-3 transition-colors">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                          <BookOpen className="w-5 h-5 text-[#854cf4]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{subject}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {!profile.teachingSubjects && (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground mb-4">No teaching subjects added yet</p>
                        {isOwnProfile && (
                          <Button
                            size="sm"
                            onClick={() => setIsAboutEditMode(true)}
                            className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Add Teaching Subjects
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

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

        {!isTeacher && (
          <TabsContent value="connections" className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {connections.map((connection) => (
                <ConnectionCard key={connection.id} connection={connection} currentUserId={parseInt(userId)} />
              ))}
            </div>
          </TabsContent>
        )}
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