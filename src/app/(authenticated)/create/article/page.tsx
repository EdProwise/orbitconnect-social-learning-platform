'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';

export default function CreateArticlePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setCoverImageFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setCoverImagePreview(result);
      setCoverImage(result); // Use base64 for demo purposes
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title for your article');
      return;
    }

    if (!content.trim() || content === '<p></p>') {
      toast.error('Please write some content for your article');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) {
        toast.error('Please log in to create an article');
        router.push('/login');
        return;
      }

      const postData: any = {
        userId: user.id,
        type: 'ARTICLE',
        title: title.trim(),
        content: content,
      };

      // Add cover image if provided
      if (coverImage.trim()) {
        postData.mediaUrls = [coverImage.trim()];
      }

      await apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      toast.success('Article published successfully!');
      
      // Redirect to feed
      router.push('/feed');
    } catch (error) {
      console.error('Failed to create article:', error);
      toast.error('Failed to create article. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/feed">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Button>
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-poppins">Write an Article</CardTitle>
            <p className="text-sm text-muted-foreground">
              Share your knowledge and insights with the community
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Article Title *</Label>
              <Input
                id="title"
                placeholder="Enter a compelling title for your article..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                className="text-lg font-semibold"
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image (Optional)</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="coverImage"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageSelect}
                    disabled={isSubmitting}
                  />
                  {coverImagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setCoverImage('');
                        setCoverImageFile(null);
                        setCoverImagePreview('');
                      }}
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {coverImagePreview && (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a cover image to make your article stand out (max 5MB, JPG/PNG/GIF)
              </p>
            </div>

            {/* Rich Text Editor */}
            <div className="space-y-2">
              <Label>Content *</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your article content here... Use the toolbar to format text, add images, and more."
                editable={!isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Use the toolbar to format your content with headings, bold, italic, lists, and more
              </p>
            </div>

            {/* Actions */}
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
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish Article'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}