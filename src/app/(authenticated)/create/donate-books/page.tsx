'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Gift, MapPin, Phone, X } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';

export default function DonateBooksPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
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
      alert('Please enter a title for your donation');
      return;
    }

    if (!description.trim()) {
      alert('Please describe what you\'re donating');
      return;
    }

    if (!location.trim()) {
      alert('Please provide a location');
      return;
    }

    if (!contact.trim()) {
      alert('Please provide contact information');
      return;
    }

    setIsSubmitting(true);

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) {
        alert('Please log in to create a donation post');
        router.push('/login');
        return;
      }

      const validUrls = fileUrls.filter(url => url.trim());

      // Combine all info into content field
      const contentText = `${description}\n\n📍 Location: ${location}\n📞 Contact: ${contact}`;

      const postData: any = {
        userId: user.id,
        type: 'DONATE_BOOKS',
        title: title.trim(),
        content: contentText,
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
      console.error('Failed to create donation post:', error);
      alert('Failed to create donation post. Please try again.');
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
              <Label>Photos (Optional)</Label>
              {fileUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Enter photo URL of the books..."
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
                Add Another Photo
              </Button>
              <p className="text-xs text-muted-foreground">
                Add photos to help people see what you're donating
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
