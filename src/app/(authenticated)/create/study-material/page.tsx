'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, X, BookOpen, FileText } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';

export default function CreateStudyMaterialPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fileUrls, setFileUrls] = useState<string[]>(['']);

  const addFileUrl = () => {
    setFileUrls([...fileUrls, '']);
  };

  const updateFileUrl = (index: number, url: string) => {
    const newUrls = [...fileUrls];
    newUrls[index] = url;
    setFileUrls(newUrls);
  };

  const removeFileUrl = (index: number) => {
    setFileUrls(fileUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter the name of the study material');
      return;
    }

    setIsSubmitting(true);

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) {
        alert('Please log in to upload study material');
        router.push('/login');
        return;
      }

      const validUrls = fileUrls.filter(url => url.trim());

      const postData: any = {
        userId: user.id,
        type: 'STUDY_MATERIAL',
        title: title.trim(),
        content: content.trim() || null,
      };

      if (validUrls.length > 0) {
        postData.fileUrls = validUrls;
      }

      await apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      router.push('/feed');
    } catch (error) {
      console.error('Failed to upload study material:', error);
      alert('Failed to upload study material. Please try again.');
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
              <BookOpen className="w-6 h-6 text-[#854cf4]" />
              Upload Study Material
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Share educational resources with the community
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Material Name *</Label>
              <Input
                id="title"
                placeholder="E.g., Physics Chapter 5 Notes, Math Formula Sheet..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Description (Optional)</Label>
              <Textarea
                id="content"
                placeholder="Describe the study material, what topics it covers, who it's for..."
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-3">
              <Label>File URLs (PDF/Images)</Label>
              {fileUrls.map((url, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Enter file URL (PDF, image, etc.)..."
                    value={url}
                    onChange={(e) => updateFileUrl(index, e.target.value)}
                    disabled={isSubmitting}
                  />
                  {fileUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeFileUrl(index)}
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFileUrl}
                disabled={isSubmitting}
                className="w-full"
              >
                Add Another File
              </Button>
              <p className="text-xs text-muted-foreground">
                Add links to PDFs, images, or other study materials
              </p>
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
                    Uploading...
                  </>
                ) : (
                  'Upload Material'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
