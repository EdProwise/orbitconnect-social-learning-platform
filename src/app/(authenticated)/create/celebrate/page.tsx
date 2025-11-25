'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, X, Trophy } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';

export default function CreateCelebratePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>(['']);
  const [previews, setPreviews] = useState<string[]>(['']);

  const addMediaUrl = () => {
    setMediaUrls([...mediaUrls, '']);
    setPreviews([...previews, '']);
  };

  const updateMediaUrl = (index: number, url: string) => {
    const newUrls = [...mediaUrls];
    newUrls[index] = url;
    setMediaUrls(newUrls);

    const newPreviews = [...previews];
    newPreviews[index] = url;
    setPreviews(newPreviews);
  };

  const removeMediaUrl = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter what you\'re celebrating');
      return;
    }

    setIsSubmitting(true);

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) {
        alert('Please log in to share a celebration');
        router.push('/login');
        return;
      }

      const validUrls = mediaUrls.filter(url => url.trim());

      const postData: any = {
        userId: user.id,
        type: 'CELEBRATE',
        title: title.trim(),
        content: content.trim() || null,
      };

      if (validUrls.length > 0) {
        postData.mediaUrls = validUrls;
      }

      await apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      router.push('/feed');
    } catch (error) {
      console.error('Failed to create celebration:', error);
      alert('Failed to create celebration. Please try again.');
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
              <Label htmlFor="title">What are you celebrating? *</Label>
              <Input
                id="title"
                placeholder="E.g., Got accepted to university, Won a competition, Completed a course..."
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
              <Label>Add Photos/Videos (Optional)</Label>
              {mediaUrls.map((url, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter photo or video URL..."
                      value={url}
                      onChange={(e) => updateMediaUrl(index, e.target.value)}
                      disabled={isSubmitting}
                    />
                    {mediaUrls.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeMediaUrl(index)}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {previews[index] && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                      <img
                        src={previews[index]}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={() => {
                          const newPreviews = [...previews];
                          newPreviews[index] = '';
                          setPreviews(newPreviews);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMediaUrl}
                disabled={isSubmitting}
                className="w-full"
              >
                Add Another Media
              </Button>
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
                disabled={isSubmitting || !title.trim()}
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
