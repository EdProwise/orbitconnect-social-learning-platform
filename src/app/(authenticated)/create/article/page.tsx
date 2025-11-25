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

export default function CreateArticlePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const handleImageUrlChange = (url: string) => {
    setCoverImage(url);
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a title for your article');
      return;
    }

    if (!content.trim() || content === '<p></p>') {
      alert('Please write some content for your article');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) {
        alert('Please log in to create an article');
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

      // Redirect to feed
      router.push('/feed');
    } catch (error) {
      console.error('Failed to create article:', error);
      alert('Failed to create article. Please try again.');
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
                    placeholder="Enter image URL..."
                    value={coverImage}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setCoverImage('');
                        setImagePreview('');
                      }}
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {imagePreview && (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border">
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={() => {
                        setImagePreview('');
                        alert('Failed to load image. Please check the URL.');
                      }}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Add a cover image to make your article stand out
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
