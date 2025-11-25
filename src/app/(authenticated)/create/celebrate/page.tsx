'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, X, Trophy, Upload } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';

const celebrationTypes = [
  'Academic Achievement',
  'Competition Win',
  'Scholarship Received',
  'Course Completion',
  'Project Success',
  'Award Received',
  'University Acceptance',
  'Graduation',
  'Certification Earned',
  'Personal Milestone',
  'Other'
];

export default function CreateCelebratePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [celebrationType, setCelebrationType] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Filter for images and videos
    const validFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (validFiles.length !== selectedFiles.length) {
      toast.error('Only image and video files are allowed');
    }

    setFiles(prev => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!celebrationType) {
      toast.error('Please select what you\'re celebrating');
      return;
    }

    if (!title.trim()) {
      toast.error('Please describe your celebration');
      return;
    }

    setIsSubmitting(true);

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) {
        toast.error('Please log in to share a celebration');
        router.push('/login');
        return;
      }

      // Convert files to base64 for storage
      const mediaUrls: string[] = [];
      for (const file of files) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        mediaUrls.push(base64);
      }

      const postData: any = {
        userId: user.id,
        type: 'CELEBRATE',
        title: `${celebrationType}: ${title.trim()}`,
        content: content.trim() || null,
      };

      if (mediaUrls.length > 0) {
        postData.mediaUrls = mediaUrls;
      }

      await apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      toast.success('Celebration shared successfully!');
      router.push('/feed');
    } catch (error) {
      console.error('Failed to create celebration:', error);
      toast.error('Failed to create celebration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/feed">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-poppins flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[#854cf4]" />
              Celebrate
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Share your achievements and milestones
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="celebration-type">What are you celebrating? *</Label>
              <Select value={celebrationType} onValueChange={setCelebrationType} disabled={isSubmitting}>
                <SelectTrigger id="celebration-type">
                  <SelectValue placeholder="Select celebration type" />
                </SelectTrigger>
                <SelectContent>
                  {celebrationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Describe your celebration *</Label>
              <Input
                id="title"
                placeholder="E.g., Got accepted to Stanford University, Won first place in coding competition..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Tell us more (Optional)</Label>
              <Textarea
                id="content"
                placeholder="Share your celebration story..."
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-3">
              <Label>Upload Photos/Videos (Optional)</Label>
              
              {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                        {files[index].type.startsWith('video/') ? (
                          <video
                            src={preview}
                            className="w-full h-full object-cover"
                            controls
                          />
                        ) : (
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="hidden"
                  id="file-upload"
                />
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Click to upload photos or videos</span>
                  <span className="text-xs text-muted-foreground">
                    Supports: JPG, PNG, GIF, MP4, MOV, etc.
                  </span>
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/feed')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim() || !celebrationType}
                className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Share Celebration'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}