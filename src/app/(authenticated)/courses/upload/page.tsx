'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Video, X, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';

export default function UploadCoursePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'BEGINNER',
    price: '0',
    durationHours: '',
  });

  useEffect(() => {
    // Get current user
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      
      // Only teachers can upload courses
      if (user.role !== 'TEACHER') {
        toast.error('Only teachers can upload courses');
        router.push('/courses');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Video size must be less than 500MB');
      return;
    }

    setVideoFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setThumbnailFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Please log in to upload courses');
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a course title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a course description');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    if (!videoFile) {
      toast.error('Please upload a course video');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price (0 or greater)');
      return;
    }

    setIsLoading(true);

    try {
      // Create slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Prepare course data
      const courseData = {
        title: formData.title.trim(),
        slug: `${slug}-${Date.now()}`,
        description: formData.description.trim(),
        instructorId: currentUser.id,
        category: formData.category,
        thumbnail: thumbnailPreview || null,
        durationHours: formData.durationHours ? parseInt(formData.durationHours) : null,
        level: formData.level,
        price: price,
        videoUrl: videoPreview, // In production, upload to storage service
        enrolledCount: 0,
        rating: 0,
      };

      // Create course via API
      const response = await apiRequest('/api/courses', {
        method: 'POST',
        body: JSON.stringify(courseData),
      });

      toast.success('Course uploaded successfully!');
      router.push(`/courses/${response.id}`);
    } catch (error: any) {
      console.error('Failed to upload course:', error);
      toast.error(error.message || 'Failed to upload course');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== 'TEACHER') {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Upload Course</h1>
          <p className="text-muted-foreground mt-2">
            Share your knowledge by creating a new course
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Introduction to Python Programming"
                disabled={isLoading}
                className="h-11"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what students will learn in this course..."
                rows={4}
                disabled={isLoading}
              />
            </div>

            {/* Category and Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Language">Language</SelectItem>
                    <SelectItem value="Arts">Arts</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="History">History</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Difficulty Level *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.durationHours}
                  onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                  placeholder="e.g., 10"
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0 for free course"
                  disabled={isLoading}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 for free course. Free courses are accessible to all users.
                </p>
              </div>
            </div>

            {/* Video Upload */}
            <div className="space-y-2">
              <Label>Course Video *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-[#854cf4] transition-colors">
                {videoPreview ? (
                  <div className="space-y-4">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full max-h-96 rounded-lg bg-black"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-sm text-muted-foreground">{videoFile?.name}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreview('');
                        }}
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoSelect}
                      className="hidden"
                      id="video-upload"
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="video-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#854cf4]/10 flex items-center justify-center">
                        <Video className="w-6 h-6 text-[#854cf4]" />
                      </div>
                      <p className="text-sm font-medium">Click to upload video</p>
                      <p className="text-xs text-muted-foreground">
                        MP4, WebM, or OGG (max 500MB)
                      </p>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <Label>Course Thumbnail (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-[#854cf4] transition-colors">
                {thumbnailPreview ? (
                  <div className="space-y-4">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full max-h-64 object-cover rounded-lg"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-sm text-muted-foreground">{thumbnailFile?.name}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setThumbnailFile(null);
                          setThumbnailPreview('');
                        }}
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailSelect}
                      className="hidden"
                      id="thumbnail-upload"
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="thumbnail-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#854cf4]/10 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-[#854cf4]" />
                      </div>
                      <p className="text-sm font-medium">Click to upload thumbnail</p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, or GIF (max 5MB)
                      </p>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Course Visibility</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                  <li>Free courses (price = $0): Accessible to all users without payment</li>
                  <li>Paid courses: Users must purchase before accessing video content</li>
                  <li>Your course will appear in the feed once published</li>
                </ul>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Course
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
