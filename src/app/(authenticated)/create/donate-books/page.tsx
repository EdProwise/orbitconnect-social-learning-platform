'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Gift, MapPin, Phone, X, Upload } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';

export default function DonateBooksPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Filter for images only
    const validFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/')
    );

    if (validFiles.length !== selectedFiles.length) {
      toast.error('Only image files are allowed');
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

    if (!title.trim()) {
      toast.error('Please enter a title for your donation');
      return;
    }

    if (!description.trim()) {
      toast.error('Please describe what you\'re donating');
      return;
    }

    if (!location.trim()) {
      toast.error('Please provide a location');
      return;
    }

    if (!contact.trim()) {
      toast.error('Please provide contact information');
      return;
    }

    setIsSubmitting(true);

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) {
        toast.error('Please log in to create a donation post');
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

      // Combine all info into content field
      const contentText = `${description}\n\n📍 Location: ${location}\n📞 Contact: ${contact}`;

      const postData: any = {
        userId: user.id,
        type: 'DONATE_BOOKS',
        title: title.trim(),
        content: contentText,
      };

      if (fileUrls.length > 0) {
        postData.fileUrls = fileUrls;
      }

      await apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      toast.success('Donation post created successfully!');
      router.push('/feed');
    } catch (error) {
      console.error('Failed to create donation post:', error);
      toast.error('Failed to create donation post. Please try again.');
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
              <Gift className="w-6 h-6 text-[#854cf4]" />
              Donate Books
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Share knowledge by donating books to those who need them
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Donation Title *</Label>
              <Input
                id="title"
                placeholder="E.g., Physics Textbooks for High School, Programming Books Collection..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the books you're donating (titles, condition, subjects, etc.)..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Pickup Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="City, area, or full address..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="contact"
                  type="tel"
                  placeholder="Your phone number or email..."
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This will be shown publicly so interested people can reach you
              </p>
            </div>

            <div className="space-y-3">
              <Label>Upload Photos (Optional)</Label>
              
              {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
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
                  accept="image/*"
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
                  <span className="text-sm font-medium">Click to upload photos of the books</span>
                  <span className="text-xs text-muted-foreground">
                    Supports: JPG, PNG, GIF
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
                disabled={isSubmitting || !title.trim() || !description.trim() || !location.trim() || !contact.trim()}
                className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Donation'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}