'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Image as ImageIcon, 
  HelpCircle, 
  Trophy, 
  BarChart3, 
  BookOpen, 
  Gift,
  Loader2,
  X
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

const postTypes = [
  { value: 'ARTICLE', label: 'Article', icon: FileText },
  { value: 'PHOTO_VIDEO', label: 'Photo/Video', icon: ImageIcon },
  { value: 'QUESTION', label: 'Question', icon: HelpCircle },
  { value: 'CELEBRATE', label: 'Celebrate', icon: Trophy },
  { value: 'POLL', label: 'Poll', icon: BarChart3 },
  { value: 'STUDY_MATERIAL', label: 'Study Material', icon: BookOpen },
  { value: 'DONATE_BOOKS', label: 'Donate Books', icon: Gift },
];

interface PostComposerProps {
  onPostCreated?: (post: any) => void;
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const [activeTab, setActiveTab] = useState('ARTICLE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mediaUrls: [] as string[],
    pollOptions: ['', ''],
    fileUrls: [] as string[],
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsSubmitting(true);

    try {
      const postData: any = {
        userId: 5, // TODO: Get from auth context
        type: activeTab,
        title: formData.title,
        content: formData.content || null,
      };

      if (activeTab === 'PHOTO_VIDEO' && formData.mediaUrls.length > 0) {
        postData.mediaUrls = formData.mediaUrls.filter(url => url.trim());
      }

      if (activeTab === 'POLL' && formData.pollOptions.filter(o => o.trim()).length >= 2) {
        postData.pollOptions = formData.pollOptions.filter(o => o.trim());
      }

      if ((activeTab === 'STUDY_MATERIAL' || activeTab === 'DONATE_BOOKS') && formData.fileUrls.length > 0) {
        postData.fileUrls = formData.fileUrls.filter(url => url.trim());
      }

      const newPost = await apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      // Reset form
      setFormData({
        title: '',
        content: '',
        mediaUrls: [],
        pollOptions: ['', ''],
        fileUrls: [],
      });

      if (onPostCreated) {
        onPostCreated(newPost);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPollOption = () => {
    setFormData({
      ...formData,
      pollOptions: [...formData.pollOptions, ''],
    });
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...formData.pollOptions];
    newOptions[index] = value;
    setFormData({ ...formData, pollOptions: newOptions });
  };

  const removePollOption = (index: number) => {
    if (formData.pollOptions.length > 2) {
      const newOptions = formData.pollOptions.filter((_, i) => i !== index);
      setFormData({ ...formData, pollOptions: newOptions });
    }
  };

  const addMediaUrl = () => {
    setFormData({
      ...formData,
      mediaUrls: [...formData.mediaUrls, ''],
    });
  };

  const updateMediaUrl = (index: number, value: string) => {
    const newUrls = [...formData.mediaUrls];
    newUrls[index] = value;
    setFormData({ ...formData, mediaUrls: newUrls });
  };

  const removeMediaUrl = (index: number) => {
    const newUrls = formData.mediaUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, mediaUrls: newUrls });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 mb-6 h-auto">
            {postTypes.map((type) => {
              const Icon = type.icon;
              return (
                <TabsTrigger
                  key={type.value}
                  value={type.value}
                  className="flex items-center gap-2 px-2 py-2 data-[state=active]:bg-[#854cf4]/10 data-[state=active]:text-[#854cf4]"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">{type.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {postTypes.map((type) => (
            <TabsContent key={type.value} value={type.value} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder={`What's your ${type.label.toLowerCase()} about?`}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Share your thoughts..."
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Photo/Video specific fields */}
              {type.value === 'PHOTO_VIDEO' && (
                <div className="space-y-2">
                  <Label>Media URLs</Label>
                  {formData.mediaUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Enter image/video URL"
                        value={url}
                        onChange={(e) => updateMediaUrl(index, e.target.value)}
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeMediaUrl(index)}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMediaUrl}
                    disabled={isSubmitting}
                  >
                    Add Media URL
                  </Button>
                </div>
              )}

              {/* Poll specific fields */}
              {type.value === 'POLL' && (
                <div className="space-y-2">
                  <Label>Poll Options</Label>
                  {formData.pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        disabled={isSubmitting}
                      />
                      {formData.pollOptions.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removePollOption(index)}
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
                    onClick={addPollOption}
                    disabled={isSubmitting}
                  >
                    Add Poll Option
                  </Button>
                </div>
              )}

              {/* Study Material / Donate Books file URLs */}
              {(type.value === 'STUDY_MATERIAL' || type.value === 'DONATE_BOOKS') && (
                <div className="space-y-2">
                  <Label>File URLs (Optional)</Label>
                  {formData.fileUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Enter file URL"
                        value={url}
                        onChange={(e) => {
                          const newUrls = [...formData.fileUrls];
                          newUrls[index] = e.target.value;
                          setFormData({ ...formData, fileUrls: newUrls });
                        }}
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newUrls = formData.fileUrls.filter((_, i) => i !== index);
                          setFormData({ ...formData, fileUrls: newUrls });
                        }}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        fileUrls: [...formData.fileUrls, ''],
                      });
                    }}
                    disabled={isSubmitting}
                  >
                    Add File URL
                  </Button>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.title.trim()}
                  className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish'
                  )}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
