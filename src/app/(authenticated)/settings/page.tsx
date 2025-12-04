'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Lock, Bell, Eye, X, Plus, Camera, Upload } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [showImageUpload, setShowImageUpload] = useState<'avatar' | 'cover' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    bio: '',
    schoolId: null as number | null,
    currentTown: '',
    phone: '',
    dateOfBirth: '',
    socialMediaLinks: { instagram: '', twitter: '', linkedin: '' },
    class: '',
    schoolHistory: [{ schoolName: '', from: '', to: '' }],
    aboutYourself: '',
    teachingExperience: [{ schoolName: '', designation: '', teachingLevel: '', from: '', to: '' }],
    skills: [''],
    teachingSubjects: [''],
  });

  useEffect(() => {
    fetchUserData();
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const schoolsData = await apiRequest('/api/schools?limit=100', { method: 'GET' });
      setSchools(schoolsData);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      
      if (!user.id) {
        toast.error('Please log in to access settings');
        return;
      }

      const userData = await apiRequest(`/api/users?id=${user.id}`, { method: 'GET' });
      setCurrentUser(userData);
      setProfileForm({
        name: userData.name || '',
        email: userData.email || '',
        bio: userData.bio || '',
        schoolId: userData.schoolId || null,
        currentTown: userData.currentTown || '',
        phone: userData.phone || '',
        dateOfBirth: userData.dateOfBirth || '',
        socialMediaLinks: userData.socialMediaLinks || { instagram: '', twitter: '', linkedin: '' },
        class: userData.class || '',
        schoolHistory: userData.schoolHistory || [{ schoolName: '', from: '', to: '' }],
        aboutYourself: userData.aboutYourself || '',
        teachingExperience: userData.teachingExperience || [{ schoolName: '', designation: '', teachingLevel: '', from: '', to: '' }],
        skills: userData.skills || [''],
        teachingSubjects: userData.teachingSubjects || [''],
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    // Validate character limits
    if (profileForm.bio.length > 250) {
      toast.error('Bio must be 250 characters or less');
      return;
    }
    if (profileForm.aboutYourself.length > 1000) {
      toast.error('About Yourself must be 1000 characters or less');
      return;
    }

    try {
      setIsSaving(true);
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      
      // For teachers, handle teacher-specific fields separately
      if (isTeacher) {
        // Update basic fields with PUT
        await apiRequest(`/api/users?id=${user.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: profileForm.name,
            email: profileForm.email,
            bio: profileForm.bio,
            schoolId: profileForm.schoolId,
            currentTown: profileForm.currentTown,
            phone: profileForm.phone,
            socialMediaLinks: profileForm.socialMediaLinks,
            aboutYourself: profileForm.aboutYourself,
          }),
        });
        
        // Update teacher-specific fields with PATCH
        const cleanedTeachingExperience = profileForm.teachingExperience.filter(exp => exp.schoolName && exp.designation && exp.teachingLevel);
        const cleanedSkills = profileForm.skills.filter(skill => skill.trim() !== '');
        const cleanedSubjects = profileForm.teachingSubjects.filter(subject => subject.trim() !== '');
        
        await apiRequest(`/api/users?id=${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            teachingExperience: cleanedTeachingExperience.length > 0 ? cleanedTeachingExperience : null,
            skills: cleanedSkills.length > 0 ? cleanedSkills : null,
            teachingSubjects: cleanedSubjects.length > 0 ? cleanedSubjects : null,
          }),
        });
      } else {
        // For students, use PUT
        await apiRequest(`/api/users?id=${user.id}`, {
          method: 'PUT',
          body: JSON.stringify(profileForm),
        });
      }
      
      toast.success('Profile updated successfully!');
      // Refresh user data
      await fetchUserData();
      
      // Update localStorage with new profile data
      const updatedUser = { ...user, ...profileForm };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Set flag to notify profile page to refetch
      localStorage.setItem('profileNeedsRefetch', 'true');
      
      // Dispatch custom event to notify profile page
      window.dispatchEvent(new CustomEvent('profileUpdated'));
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
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      const field = showImageUpload === 'avatar' ? 'avatar' : 'coverImage';
      
      // For demo purposes, we'll use the preview URL (base64)
      // In production, you'd upload to a storage service first
      await apiRequest(`/api/users?id=${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ [field]: previewUrl }),
      });
      
      // Refetch user data to get latest from database
      await fetchUserData();
      
      // Update localStorage with new image
      const updatedUser = { ...user, [field]: previewUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Dispatch storage event to notify other components
      window.dispatchEvent(new Event('storage'));
      
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
    setProfileForm({
      ...profileForm,
      schoolHistory: [...profileForm.schoolHistory, { schoolName: '', from: '', to: '' }],
    });
  };

  const removeSchoolHistory = (index: number) => {
    const newHistory = profileForm.schoolHistory.filter((_, i) => i !== index);
    setProfileForm({ ...profileForm, schoolHistory: newHistory });
  };

  const updateSchoolHistory = (index: number, field: string, value: string) => {
    const newHistory = [...profileForm.schoolHistory];
    newHistory[index] = { ...newHistory[index], [field]: value };
    setProfileForm({ ...profileForm, schoolHistory: newHistory });
  };

  // Teacher-specific helper functions
  const addTeachingExperience = () => {
    setProfileForm({
      ...profileForm,
      teachingExperience: [...profileForm.teachingExperience, { schoolName: '', designation: '', teachingLevel: '', from: '', to: '' }],
    });
  };

  const removeTeachingExperience = (index: number) => {
    const newExperience = profileForm.teachingExperience.filter((_, i) => i !== index);
    setProfileForm({ ...profileForm, teachingExperience: newExperience });
  };

  const updateTeachingExperience = (index: number, field: string, value: string) => {
    const newExperience = [...profileForm.teachingExperience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    setProfileForm({ ...profileForm, teachingExperience: newExperience });
  };

  const addSkill = () => {
    setProfileForm({
      ...profileForm,
      skills: [...profileForm.skills, ''],
    });
  };

  const removeSkill = (index: number) => {
    const newSkills = profileForm.skills.filter((_, i) => i !== index);
    setProfileForm({ ...profileForm, skills: newSkills });
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...profileForm.skills];
    newSkills[index] = value;
    setProfileForm({ ...profileForm, skills: newSkills });
  };

  const addSubject = () => {
    setProfileForm({
      ...profileForm,
      teachingSubjects: [...profileForm.teachingSubjects, ''],
    });
  };

  const removeSubject = (index: number) => {
    const newSubjects = profileForm.teachingSubjects.filter((_, i) => i !== index);
    setProfileForm({ ...profileForm, teachingSubjects: newSubjects });
  };

  const updateSubject = (index: number, value: string) => {
    const newSubjects = [...profileForm.teachingSubjects];
    newSubjects[index] = value;
    setProfileForm({ ...profileForm, teachingSubjects: newSubjects });
  };

  const isStudent = currentUser?.role === 'STUDENT';
  const isTeacher = currentUser?.role === 'TEACHER';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-poppins">Settings</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading settings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-poppins">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Eye className="w-4 h-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile & Cover Images */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Images</CardTitle>
              <CardDescription>
                Update your profile and cover images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cover Image */}
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="relative h-32 bg-gradient-to-br from-[#854cf4] to-[#6b3cc9] rounded-lg overflow-hidden">
                  {currentUser?.coverImage && (
                    <img src={currentUser.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={() => setShowImageUpload('cover')}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Change Cover
                  </Button>
                </div>
              </div>

              {/* Profile Image */}
              <div className="space-y-2">
                <Label>Profile Image</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={currentUser?.avatar || ''} alt={currentUser?.name} />
                    <AvatarFallback className="text-2xl">{currentUser?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <Button
                    variant="outline"
                    onClick={() => setShowImageUpload('avatar')}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Picture
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@example.com"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio">Bio</Label>
                  <span className="text-xs text-muted-foreground">
                    {profileForm.bio.length}/250 characters
                  </span>
                </div>
                <Textarea 
                  id="bio" 
                  placeholder="Tell us about yourself..."
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 250) {
                      setProfileForm({ ...profileForm, bio: e.target.value });
                    }
                  }}
                  maxLength={250}
                />
              </div>

              {isStudent && (
                <>
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-4">Student Information</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="assignedSchool">Assigned School</Label>
                        <Select
                          value={profileForm.schoolId?.toString() || 'none'}
                          onValueChange={(value) => setProfileForm({ ...profileForm, schoolId: value === 'none' ? null : parseInt(value) })}
                        >
                          <SelectTrigger id="assignedSchool">
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
                        <Label htmlFor="currentTown">Current Town</Label>
                        <Input
                          id="currentTown"
                          placeholder="e.g., Mumbai"
                          value={profileForm.currentTown}
                          onChange={(e) => setProfileForm({ ...profileForm, currentTown: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="e.g., +91 98765 43210"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={profileForm.dateOfBirth}
                          onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Social Media Links</Label>
                        <div className="space-y-2">
                          <Input
                            placeholder="Instagram username or URL"
                            value={profileForm.socialMediaLinks.instagram || ''}
                            onChange={(e) => setProfileForm({
                              ...profileForm,
                              socialMediaLinks: { ...profileForm.socialMediaLinks, instagram: e.target.value }
                            })}
                          />
                          <Input
                            placeholder="Twitter/X username or URL"
                            value={profileForm.socialMediaLinks.twitter || ''}
                            onChange={(e) => setProfileForm({
                              ...profileForm,
                              socialMediaLinks: { ...profileForm.socialMediaLinks, twitter: e.target.value }
                            })}
                          />
                          <Input
                            placeholder="LinkedIn profile URL"
                            value={profileForm.socialMediaLinks.linkedin || ''}
                            onChange={(e) => setProfileForm({
                              ...profileForm,
                              socialMediaLinks: { ...profileForm.socialMediaLinks, linkedin: e.target.value }
                            })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>School History</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addSchoolHistory}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add School
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {profileForm.schoolHistory.map((school, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-2 bg-muted/30">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">School {index + 1}</span>
                                {profileForm.schoolHistory.length > 1 && (
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

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="aboutYourself">About Yourself</Label>
                          <span className="text-xs text-muted-foreground">
                            {profileForm.aboutYourself.length}/1000 characters
                          </span>
                        </div>
                        <Textarea
                          id="aboutYourself"
                          placeholder="Tell us more about yourself, your interests, goals, and aspirations..."
                          rows={6}
                          value={profileForm.aboutYourself}
                          onChange={(e) => {
                            if (e.target.value.length <= 1000) {
                              setProfileForm({ ...profileForm, aboutYourself: e.target.value });
                            }
                          }}
                          maxLength={1000}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {isTeacher && (
                <>
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-4">Teacher Information</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="assignedSchool">Assigned School</Label>
                        <Select
                          value={profileForm.schoolId?.toString() || 'none'}
                          onValueChange={(value) => setProfileForm({ ...profileForm, schoolId: value === 'none' ? null : parseInt(value) })}
                        >
                          <SelectTrigger id="assignedSchool">
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
                        <Label htmlFor="currentTown">Current Town</Label>
                        <Input
                          id="currentTown"
                          placeholder="e.g., Mumbai"
                          value={profileForm.currentTown}
                          onChange={(e) => setProfileForm({ ...profileForm, currentTown: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="e.g., +91 98765 43210"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Social Media Links</Label>
                        <div className="space-y-2">
                          <Input
                            placeholder="Instagram username or URL"
                            value={profileForm.socialMediaLinks.instagram || ''}
                            onChange={(e) => setProfileForm({
                              ...profileForm,
                              socialMediaLinks: { ...profileForm.socialMediaLinks, instagram: e.target.value }
                            })}
                          />
                          <Input
                            placeholder="Twitter/X username or URL"
                            value={profileForm.socialMediaLinks.twitter || ''}
                            onChange={(e) => setProfileForm({
                              ...profileForm,
                              socialMediaLinks: { ...profileForm.socialMediaLinks, twitter: e.target.value }
                            })}
                          />
                          <Input
                            placeholder="LinkedIn profile URL"
                            value={profileForm.socialMediaLinks.linkedin || ''}
                            onChange={(e) => setProfileForm({
                              ...profileForm,
                              socialMediaLinks: { ...profileForm.socialMediaLinks, linkedin: e.target.value }
                            })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Teaching Experience</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addTeachingExperience}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Experience
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {profileForm.teachingExperience.map((exp, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-2 bg-muted/30">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Experience {index + 1}</span>
                                {profileForm.teachingExperience.length > 1 && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeTeachingExperience(index)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              <Input
                                value={exp.schoolName}
                                onChange={(e) => updateTeachingExperience(index, 'schoolName', e.target.value)}
                                placeholder="School Name"
                              />
                              <Input
                                value={exp.designation}
                                onChange={(e) => updateTeachingExperience(index, 'designation', e.target.value)}
                                placeholder="Designation (e.g., Senior Teacher)"
                              />
                              <Input
                                value={exp.teachingLevel}
                                onChange={(e) => updateTeachingExperience(index, 'teachingLevel', e.target.value)}
                                placeholder="Teaching Level (e.g., High School)"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={exp.from}
                                  onChange={(e) => updateTeachingExperience(index, 'from', e.target.value)}
                                  placeholder="From (e.g., 2020)"
                                />
                                <Input
                                  value={exp.to}
                                  onChange={(e) => updateTeachingExperience(index, 'to', e.target.value)}
                                  placeholder="To (e.g., 2024)"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Skills</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addSkill}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Skill
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {profileForm.skills.map((skill, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-2 bg-muted/30">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Skill {index + 1}</span>
                                {profileForm.skills.length > 1 && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeSkill(index)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              <Input
                                value={skill}
                                onChange={(e) => updateSkill(index, e.target.value)}
                                placeholder="Skill name (e.g., Classroom Management)"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Teaching Subjects</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addSubject}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Subject
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {profileForm.teachingSubjects.map((subject, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-2 bg-muted/30">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Subject {index + 1}</span>
                                {profileForm.teachingSubjects.length > 1 && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeSubject(index)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              <Input
                                value={subject}
                                onChange={(e) => updateSubject(index, e.target.value)}
                                placeholder="Subject name (e.g., Mathematics)"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="aboutYourself">About Yourself</Label>
                          <span className="text-xs text-muted-foreground">
                            {profileForm.aboutYourself.length}/1000 characters
                          </span>
                        </div>
                        <Textarea
                          id="aboutYourself"
                          placeholder="Tell us more about yourself, your teaching philosophy, goals, and aspirations..."
                          rows={6}
                          value={profileForm.aboutYourself}
                          onChange={(e) => {
                            if (e.target.value.length <= 1000) {
                              setProfileForm({ ...profileForm, aboutYourself: e.target.value });
                            }
                          }}
                          maxLength={1000}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can see your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to everyone
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your email on your profile
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Connection Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anyone to send you connection requests
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Comments</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when someone comments on your posts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reactions</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when someone reacts to your posts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when you receive new messages
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Connection Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when someone wants to connect
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button className="bg-[#854cf4] hover:bg-[#7743e0] text-white">
                Update Password
              </Button>
            </CardContent>
          </Card>
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
              <Label className="text-sm font-medium">Upload Image</Label>
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
                  className={showImageUpload === 'avatar' ? 'w-32 h-32 rounded-full object-cover mx-auto' : 'w-full h-48 rounded-lg object-cover'}
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