'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, X, BookOpen, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';

export default function CreateStudyMaterialPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ type: string; url: string; name: string }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Filter for images and PDFs
    const validFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );

    if (validFiles.length !== selectedFiles.length) {
      toast.error('Only image and PDF files are allowed');
    }

    setFiles(prev => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, {
          type: file.type,
          url: reader.result as string,
          name: file.name
        }]);
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

    if (!title.trim()) {
      toast.error('Please enter the name of the study material');
      return;
    }

    setIsSubmitting(true);

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) {
        toast.error('Please log in to upload study material');
        router.push('/login');
        return;
      }

      // Convert files to base64 for storage
      const fileUrls: string[] = [];
      for (const file of files) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        fileUrls.push(base64);
      }

      const postData: any = {
        userId: user.id,
        type: 'STUDY_MATERIAL',
        title: title.trim(),
        content: content.trim() || null,
      };

      if (fileUrls.length > 0) {
        postData.fileUrls = fileUrls;
      }

      await apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      toast.success('Study material uploaded successfully!');
      router.push('/feed');
    } catch (error) {
      console.error('Failed to upload study material:', error);
      toast.error('Failed to upload study material. Please try again.');
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
              <Label>Upload Files (Images & PDFs)</Label>
              
              {previews.length > 0 && (
                <div className="space-y-2">
                  {previews.map((preview, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg group hover:bg-muted/50 transition-colors">
                      {preview.type === 'application/pdf' ? (
                        <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded overflow-hidden border border-border flex-shrink-0">
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{preview.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {preview.type === 'application/pdf' ? 'PDF Document' : 'Image'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
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
                  accept="image/*,application/pdf"
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
                  <span className="text-sm font-medium">Click to upload images or PDFs</span>
                  <span className="text-xs text-muted-foreground">
                    Supports: JPG, PNG, GIF, PDF
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