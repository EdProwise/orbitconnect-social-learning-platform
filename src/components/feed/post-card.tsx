'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  ThumbsUp,
  Lightbulb,
  HandHeart,
  Send,
  Loader2,
  MoreVertical,
  BookOpen,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Trophy,
  BarChart3,
  Gift,
  Edit2,
  Trash2,
  Zap,
  ArrowRight,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  FileIcon,
  Download,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';

interface Post {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string | null;
  mediaUrls: string[] | null;
  pollOptions: any[] | null;
  fileUrls: string[] | null;
  viewCount: number;
  createdAt: string;
}

interface PostCardProps {
  post: Post;
}

interface UserData {
  id: number;
  name: string;
  role: string;
  avatar: string | null;
}

interface Comment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  parentCommentId: number | null;
}

const reactionTypes = [
  { type: 'LIKE', icon: ThumbsUp, label: 'Like', color: 'text-blue-500' },
  { type: 'LOVE', icon: Heart, label: 'Love', color: 'text-red-500' },
  { type: 'INSIGHTFUL', icon: Lightbulb, label: 'Insightful', color: 'text-yellow-500' },
  { type: 'SUPPORT', icon: HandHeart, label: 'Support', color: 'text-green-500' },
];

const postTypeConfig: Record<string, { action: string; icon: any; color: string }> = {
  ARTICLE: { action: 'shared article', icon: FileText, color: 'text-blue-600' },
  PHOTO_VIDEO: { action: 'shared photos/videos', icon: ImageIcon, color: 'text-pink-600' },
  QUESTION: { action: 'asked a question', icon: HelpCircle, color: 'text-orange-600' },
  CELEBRATE: { action: 'is celebrating', icon: Trophy, color: 'text-yellow-600' },
  POLL: { action: 'started a poll', icon: BarChart3, color: 'text-purple-600' },
  STUDY_MATERIAL: { action: 'uploaded study material', icon: BookOpen, color: 'text-green-600' },
  DONATE_BOOKS: { action: 'is donating books', icon: Gift, color: 'text-red-600' },
};

// Helper function to extract text from HTML
const extractTextFromHtml = (html: string, maxLength: number = 200): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = div.textContent || div.innerText || '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Helper function to check if URL is a PDF
const isPdfUrl = (url: string): boolean => {
  return url.toLowerCase().includes('pdf') || url.startsWith('data:application/pdf');
};

// Helper function to check if URL is a video
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.ogg', '.mkv'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) || url.startsWith('data:video');
};

// Helper function to get file name from URL
const getFileName = (url: string, index: number): string => {
  if (url.startsWith('data:')) {
    return `document-${index + 1}.pdf`;
  }
  const parts = url.split('/');
  return parts[parts.length - 1] || `file-${index + 1}`;
};

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [reactions, setReactions] = useState<any[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [author, setAuthor] = useState<UserData | null>(null);
  const [pollVotes, setPollVotes] = useState<Record<number, number>>({});
  const [userVote, setUserVote] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [knowledgePoints, setKnowledgePoints] = useState(0);
  const [userKnowledgePoints, setUserKnowledgePoints] = useState(0);
  const [showKnowledgeDialog, setShowKnowledgeDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [savedRecordId, setSavedRecordId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  // Get current user
  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isAuthor = currentUser && currentUser.id === post.userId;

  useEffect(() => {
    fetchAuthor();
    fetchReactions();
    fetchKnowledgePoints();
    fetchUserKnowledgePoints();
    if (post.type === 'POLL' && post.pollOptions) {
      initializePollVotes();
    }
    // Initialize saved state for this post
    initSavedState();
  }, [post.id]);

  // When reactions or user changes, set user's current reaction for this post (normalize ID types)
  useEffect(() => {
    if (!currentUser?.id) return;
    const uid = Number(currentUser.id);
    const mine = reactions.find((r) => Number(r.userId) === uid);
    setUserReaction(mine?.type ?? null);
  }, [reactions, currentUser?.id]);

  // Selected reaction visuals
  const selectedReaction = reactionTypes.find((r) => r.type === userReaction);
  const SelectedReactionIcon = selectedReaction?.icon || ThumbsUp;
  const selectedReactionColor = selectedReaction?.color || '';

  const initSavedState = async () => {
    try {
      if (!currentUser?.id) return;
      const result = await apiRequest<any[]>(`/api/saved-posts?userId=${currentUser.id}&postId=${post.id}&limit=1`, { method: 'GET' });
      if (Array.isArray(result) && result.length > 0) {
        setIsSaved(true);
        setSavedRecordId(result[0].id);
      } else {
        setIsSaved(false);
        setSavedRecordId(null);
      }
    } catch {
      // ignore
    }
  };

  const fetchKnowledgePoints = async () => {
    try {
      const data = await apiRequest(`/api/knowledge-points?postId=${post.id}`, { method: 'GET' });
      setKnowledgePoints(data.postTotalPoints || 0);
    } catch (error) {
      console.error('Failed to fetch knowledge points:', error);
    }
  };

  const fetchUserKnowledgePoints = async () => {
    if (!currentUser) return;
    
    try {
      const data = await apiRequest(`/api/knowledge-points?postId=${post.id}&awarderId=${currentUser.id}`, { 
        method: 'GET' 
      });
      setUserKnowledgePoints(data.totalPointsAwarded || 0);
    } catch (error) {
      console.error('Failed to fetch user knowledge points:', error);
    }
  };

  const initializePollVotes = () => {
    if (post.pollOptions) {
      const votes: Record<number, number> = {};
      post.pollOptions.forEach((option: any, index: number) => {
        votes[index] = option.votes || 0;
      });
      setPollVotes(votes);
    }
  };

  const fetchAuthor = async () => {
    try {
      const data = await apiRequest(`/api/users?id=${post.userId}`, { method: 'GET' });
      setAuthor(data);
    } catch (error) {
      console.error('Failed to fetch author:', error);
    }
  };

  const fetchReactions = async () => {
    try {
      const data = await apiRequest(`/api/reactions?postId=${post.id}`, { method: 'GET' });
      setReactions(data);
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
    }
  };

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const data = await apiRequest(`/api/comments?postId=${post.id}&parentCommentId=null`, { 
        method: 'GET' 
      });
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAwardKnowledgePoints = async (points: number) => {
    if (!currentUser) {
      toast.error('Please log in to award knowledge points');
      return;
    }

    if (userKnowledgePoints + points > 100) {
      toast.error('Maximum 100 knowledge points can be awarded per post');
      return;
    }

    try {
      const data = await apiRequest('/api/knowledge-points', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          awarderId: currentUser.id,
          points: points,
        }),
      });

      // Update local state with server response
      setUserKnowledgePoints(data.totalPointsAwarded);
      setKnowledgePoints(data.postTotalPoints);
      setShowKnowledgeDialog(false);
      toast.success(`Awarded ${points} knowledge points!`);
    } catch (error: any) {
      console.error('Failed to award knowledge points:', error);
      
      // Handle specific error codes
      if (error.message && error.message.includes('already awarded')) {
        toast.error('You have already reached the maximum points for this post');
      } else if (error.message && error.message.includes('your own post')) {
        toast.error('You cannot award points to your own post');
      } else {
        toast.error('Failed to award knowledge points');
      }
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const comment = await apiRequest('/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          userId: user?.id || 5,
          content: newComment,
        }),
      });
      setComments([...comments, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReaction = async (type: string) => {
    if (isReacting) return;

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user?.id) {
      toast.error('Please log in to react');
      return;
    }

    // Enforce single reaction per user per post (no duplicate same-type submits)
    if (userReaction === type) {
      setShowReactionPicker(false);
      return;
    }

    try {
      setIsReacting(true);
      // Optimistic update (replace existing user reaction or add new)
      setUserReaction(type);
      setShowReactionPicker(false);
      setReactions((prev) => {
        const mineIndex = prev.findIndex((r) => Number(r.userId) === user.id && r.postId === post.id);
        if (mineIndex >= 0) {
          const copy = [...prev];
          copy[mineIndex] = { ...copy[mineIndex], type };
          return copy;
        }
        return [...prev, { id: -1, userId: user.id, postId: post.id, type }];
      });

      await apiRequest('/api/reactions', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          userId: user.id,
          type,
        }),
      });
      // Refresh from server to reconcile
      fetchReactions();
      toast.success(`Reacted with ${type.toLowerCase()}`);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      toast.error('Failed to add reaction');
    } finally {
      setIsReacting(false);
    }
  };

  const handleEditPost = async () => {
    if (!editTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    setIsUpdating(true);
    try {
      await apiRequest(`/api/posts?id=${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim() || null,
        }),
      });
      
      // Update local post data
      post.title = editTitle.trim();
      post.content = editContent.trim() || null;
      
      setIsEditMode(false);
      toast.success('Post updated successfully!');
    } catch (error) {
      console.error('Failed to update post:', error);
      toast.error('Failed to update post');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await apiRequest(`/api/posts?id=${post.id}`, {
        method: 'DELETE',
      });
      toast.success('Post deleted successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  };

  const openShareDialog = () => {
    try {
      const origin = window.location.origin;
      const link = post.type === 'ARTICLE' ? `/article/${post.id}` : `/feed?post=${post.id}`;
      setShareUrl(`${origin}${link}`);
      setShowShareDialog(true);
    } catch {
      // no-op
    }
  };

  const handleShare = async (platform?: string) => {
    const url = shareUrl;
    const text = `Check out this ${post.type.toLowerCase()}: ${post.title}`;

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
        setShowShareDialog(false);
      } catch (error) {
        toast.error('Failed to copy link');
      }
      return;
    }

    if (platform === 'native' && (navigator as any)?.share) {
      try {
        await (navigator as any).share({ title: post.title, text, url });
        setShowShareDialog(false);
      } catch {
        // user cancelled
      }
    }
  };

  const handleSave = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user?.id) {
        toast.error('Please log in to save posts');
        return;
      }
      if (isSaving) return;
      setIsSaving(true);

      if (isSaved && savedRecordId != null) {
        await apiRequest(`/api/saved-posts?id=${savedRecordId}`, { method: 'DELETE' });
        setIsSaved(false);
        setSavedRecordId(null);
        toast.success('Removed from saved');
      } else {
        const created = await apiRequest('/api/saved-posts', {
          method: 'POST',
          body: JSON.stringify({
            userId: user.id,
            postId: post.id,
          }),
        });
        setIsSaved(true);
        setSavedRecordId(created.id);
        toast.success('Saved');
      }
    } catch (error: any) {
      if (error?.code === 'DUPLICATE_SAVE') {
        setIsSaved(true);
        toast.message?.('Already saved');
      } else {
        console.error('Failed to save post:', error);
        toast.error('Failed to update saved state');
      }
    } finally {
      window.dispatchEvent(new Event('savedPostsUpdated'));
      setIsSaving(false);
    }
  };

  const handlePollVote = (optionIndex: number) => {
    if (hasVoted) return;

    const newVotes = { ...pollVotes };
    newVotes[optionIndex] = (newVotes[optionIndex] || 0) + 1;
    setPollVotes(newVotes);
    setUserVote(optionIndex);
    setHasVoted(true);
  };

  const getTotalVotes = () => {
    return Object.values(pollVotes).reduce((sum, votes) => sum + votes, 0);
  };

  const getVotePercentage = (optionIndex: number) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return Math.round(((pollVotes[optionIndex] || 0) / total) * 100);
  };

  const toggleComments = () => {
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const getReactionCount = (type: string) => {
    return reactions.filter(r => r.type === type).length;
  };

  const typeConfig = postTypeConfig[post.type] || postTypeConfig.ARTICLE;
  const TypeIcon = typeConfig.icon;

  // Blog format for articles
  if (post.type === 'ARTICLE') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Cover Image */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="relative w-full h-80 overflow-hidden">
            <img 
              src={post.mediaUrls[0]} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <Badge className="bg-[#854cf4] text-white">Article</Badge>
            </div>
          </div>
        )}

        <CardContent className="p-8">
          {/* Author Info */}
          <div className="flex items-center gap-3 mb-6">
            <Link href={`/profile/${post.userId}`}>
              <Avatar className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={author?.avatar || ''} alt={author?.name || 'User'} />
                <AvatarFallback>{author?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <Link href={`/profile/${post.userId}`} className="hover:underline">
                <h4 className="font-semibold text-base">{author?.name || 'Loading...'}</h4>
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="text-xs">{author?.role || ''}</Badge>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                {knowledgePoints > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                        {knowledgePoints}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            {isAuthor && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setIsEditMode(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDeletePost}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>

          {/* Article Title & Content */}
          {isEditMode ? (
            <div className="space-y-4 mb-6">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
                disabled={isUpdating}
                className="text-2xl font-bold"
              />
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Content"
                rows={8}
                disabled={isUpdating}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditMode(false);
                    setEditTitle(post.title);
                    setEditContent(post.content || '');
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditPost}
                  disabled={isUpdating}
                  className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold font-poppins mb-6 leading-tight">
                {post.title}
              </h2>
              
              <Link href={`/article/${post.id}`}>
                <Button
                  variant="ghost"
                  className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold mb-6"
                >
                  Read full article
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 py-4 my-4 border-y border-border text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4" />
              <span>{reactions.length} reactions</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>{comments.length} comments</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{post.viewCount} reads</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full ${userReaction ? selectedReactionColor : ''}`}
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                disabled={isReacting}
              >
                <SelectedReactionIcon className="w-4 h-4 mr-2" />
                <span className="text-xs">
                  {selectedReaction ? selectedReaction.label : 'Like'}
                </span>
              </Button>
              
              {showReactionPicker && (
                <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-2 flex gap-2 z-10">
                  {reactionTypes.map((reaction) => {
                    const Icon = reaction.icon;
                    return (
                      <Button
                        key={reaction.type}
                        variant="ghost"
                        size="sm"
                        className={`flex flex-col items-center gap-1 hover:bg-accent ${reaction.color}`}
                        onClick={() => handleReaction(reaction.type)}
                        disabled={isReacting}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{reaction.label}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={toggleComments}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Comment
            </Button>
            
            {!isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setShowKnowledgeDialog(true)}
              >
                <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                Award
              </Button>
            )}
            
            <Button variant="ghost" size="sm" className="flex-1" onClick={openShareDialog}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Bookmark className={`w-4 h-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-6 pt-6 border-t border-border space-y-4">
              {/* Add Comment */}
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://i.pravatar.cc/150?u=current" alt="You" />
                  <AvatarFallback>Y</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    disabled={isSubmittingComment}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleCommentSubmit}
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Post
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              {isLoadingComments ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} postId={post.id} />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* Knowledge Points Dialog */}
        <Dialog open={showKnowledgeDialog} onOpenChange={setShowKnowledgeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Award Knowledge Points
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Award knowledge points to recognize quality content (max 100 points per user per post)
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Already Awarded:</span>
                  <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {userKnowledgePoints} / 100
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{ width: `${userKnowledgePoints}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((points) => (
                  <Button
                    key={points}
                    variant="outline"
                    onClick={() => handleAwardKnowledgePoints(points)}
                    disabled={userKnowledgePoints + points > 100}
                    className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-yellow-500/10 hover:border-yellow-500"
                  >
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-semibold">{points}</span>
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowKnowledgeDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share this post
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} />
                <Button variant="outline" onClick={() => handleShare('copy')}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <a
                  className="flex items-center justify-center gap-2 border rounded-md py-2 hover:bg-accent"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareDialog(false)}
                >
                  <Twitter className="w-4 h-4" /> X
                </a>
                <a
                  className="flex items-center justify-center gap-2 border rounded-md py-2 hover:bg-accent"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareDialog(false)}
                >
                  <Facebook className="w-4 h-4" /> Facebook
                </a>
                <a
                  className="flex items-center justify-center gap-2 border rounded-md py-2 hover:bg-accent"
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareDialog(false)}
                >
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
                <a
                  className="flex items-center justify-center gap-2 border rounded-md py-2 hover:bg-accent"
                  href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareDialog(false)}
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
              <Button variant="secondary" onClick={() => handleShare('native')}>
                Use device share
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  // Regular post format for non-articles
  return (
    <Card>
      <CardContent className="p-6">
        {/* Post Header with Type */}
        <div className="flex items-start gap-3 mb-4">
          <Link href={`/profile/${post.userId}`}>
            <Avatar className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={author?.avatar || ''} alt={author?.name || 'User'} />
              <AvatarFallback>{author?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${post.userId}`} className="hover:underline">
                <span className="font-semibold">{author?.name || 'Loading...'}</span>
              </Link>
              <span className="text-sm text-muted-foreground">{typeConfig.action}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <TypeIcon className={`w-3 h-3 ${typeConfig.color}`} />
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              <span>•</span>
              <Badge variant="secondary" className="text-xs">
                {author?.role || ''}
              </Badge>
            </div>
          </div>
          {isAuthor && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setIsEditMode(true)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDeletePost}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          )}
          {!isAuthor && (
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Post Content */}
        {isEditMode ? (
          <div className="space-y-4 mb-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title"
              disabled={isUpdating}
            />
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Content (optional)"
              rows={4}
              disabled={isUpdating}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditMode(false);
                  setEditTitle(post.title);
                  setEditContent(post.content || '');
                }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditPost}
                disabled={isUpdating}
                className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{post.title}</h3>
            {post.content && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
            )}

            {/* Media */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className={`grid gap-2 ${post.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {post.mediaUrls.slice(0, 4).map((url, index) => {
                  const isVideo = isVideoUrl(url);
                  
                  return (
                    <div 
                      key={index} 
                      className={`rounded-lg overflow-hidden bg-muted ${
                        post.mediaUrls!.length === 1 ? 'aspect-video' : 'aspect-square'
                      }`}
                    >
                      {isVideo ? (
                        <video
                          src={url}
                          className="w-full h-full object-cover"
                          controls
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  );
                })}
                {post.mediaUrls.length > 4 && (
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                    <span className="text-2xl font-semibold text-muted-foreground">
                      +{post.mediaUrls.length - 4}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Poll with Voting */}
            {post.type === 'POLL' && post.pollOptions && post.pollOptions.length > 0 && (
              <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
                {post.pollOptions.map((option: any, index: number) => {
                  const optionText = typeof option === 'string' ? option : option.text;
                  const percentage = getVotePercentage(index);
                  const isUserVote = userVote === index;

                  return (
                    <div key={index}>
                      <Button
                        variant="outline"
                        className={`w-full justify-start h-auto py-3 relative overflow-hidden ${
                          hasVoted ? 'cursor-default' : 'hover:bg-accent'
                        } ${isUserVote ? 'border-[#854cf4] bg-[#854cf4]/5' : ''}`}
                        onClick={() => handlePollVote(index)}
                        disabled={hasVoted}
                      >
                        {hasVoted && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-[#854cf4]/10 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        )}
                        <div className="flex items-center justify-between w-full relative z-10">
                          <span className="text-sm font-medium">{optionText}</span>
                          {hasVoted && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold">{percentage}%</span>
                              <span className="text-xs text-muted-foreground">
                                ({pollVotes[index] || 0} {pollVotes[index] === 1 ? 'vote' : 'votes'})
                              </span>
                            </div>
                          )}
                        </div>
                      </Button>
                    </div>
                  );
                })}
                {hasVoted && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    {getTotalVotes()} total {getTotalVotes() === 1 ? 'vote' : 'votes'}
                  </p>
                )}
              </div>
            )}

            {/* Files */}
            {post.fileUrls && post.fileUrls.length > 0 && (
              <div className="space-y-2">
                {post.fileUrls.map((url, index) => {
                  const isPdf = isPdfUrl(url);
                  const fileName = getFileName(url, index);
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors group"
                    >
                      {isPdf ? (
                        <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                      ) : (
                        <FileIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {isPdf ? 'PDF Document' : 'File'}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8"
                        >
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8"
                        >
                          <a
                            href={url}
                            download={fileName}
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reactions Summary with Knowledge Points */}
        <div className="flex items-center gap-4 pt-4 mt-4 border-t border-border text-xs text-muted-foreground">
          <span>{reactions.length} reactions</span>
          <span>{comments.length} comments</span>
          <span>{post.viewCount} views</span>
          {knowledgePoints > 0 && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                {knowledgePoints} Knowledge Points
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-border mt-2">
          <div className="relative flex-1">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full ${userReaction ? selectedReactionColor : ''}`}
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              disabled={isReacting}
            >
              <SelectedReactionIcon className="w-4 h-4 mr-2" />
              <span className="text-xs">
                {selectedReaction ? selectedReaction.label : 'Like'}
              </span>
            </Button>
            
            {showReactionPicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-2 flex gap-2 z-10">
                {reactionTypes.map((reaction) => {
                  const Icon = reaction.icon;
                  return (
                    <Button
                      key={reaction.type}
                      variant="ghost"
                      size="sm"
                      className={`flex flex-col items-center gap-1 hover:bg-accent ${reaction.color}`}
                      onClick={() => handleReaction(reaction.type)}
                      disabled={isReacting}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{reaction.label}</span>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={toggleComments}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Comment
          </Button>
          
          {!isAuthor && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => setShowKnowledgeDialog(true)}
            >
              <Zap className="w-4 h-4 mr-2 text-yellow-500" />
              Award
            </Button>
          )}
          
          <Button variant="ghost" size="sm" className="flex-1" onClick={openShareDialog}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Bookmark className={`w-4 h-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-6 pt-6 border-t border-border space-y-4">
            {/* Add Comment */}
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://i.pravatar.cc/150?u=current" alt="You" />
                <AvatarFallback>Y</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  disabled={isSubmittingComment}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleCommentSubmit}
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} postId={post.id} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Knowledge Points Dialog */}
      <Dialog open={showKnowledgeDialog} onOpenChange={setShowKnowledgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Award Knowledge Points
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Award knowledge points to recognize quality content (max 100 points per user per post)
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Already Awarded:</span>
                <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {userKnowledgePoints} / 100
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${userKnowledgePoints}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((points) => (
                <Button
                  key={points}
                  variant="outline"
                  onClick={() => handleAwardKnowledgePoints(points)}
                  disabled={userKnowledgePoints + points > 100}
                  className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-yellow-500/10 hover:border-yellow-500"
                >
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-semibold">{points}</span>
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKnowledgeDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share this post
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} />
              <Button variant="outline" onClick={() => handleShare('copy')}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a
                className="flex items-center justify-center gap-2 border rounded-md py-2 hover:bg-accent"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareDialog(false)}
              >
                <Twitter className="w-4 h-4" /> X
              </a>
              <a
                className="flex items-center justify-center gap-2 border rounded-md py-2 hover:bg-accent"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareDialog(false)}
              >
                <Facebook className="w-4 h-4" /> Facebook
              </a>
              <a
                className="flex items-center justify-center gap-2 border rounded-md py-2 hover:bg-accent"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareDialog(false)}
              >
                <Linkedin className="w-4 h-4" /> LinkedIn
              </a>
              <a
                className="flex items-center justify-center gap-2 border rounded-md py-2 hover:bg-accent"
                href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareDialog(false)}
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
            <Button variant="secondary" onClick={() => handleShare('native')}>
              Use device share
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function CommentItem({ comment, postId }: { comment: Comment; postId: number }) {
  const [author, setAuthor] = useState<UserData | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<Comment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAuthor();
    fetchReplies();
  }, [comment.id]);

  const fetchAuthor = async () => {
    try {
      const data = await apiRequest(`/api/users?id=${comment.userId}`, { method: 'GET' });
      setAuthor(data);
    } catch (error) {
      console.error('Failed to fetch comment author:', error);
    }
  };

  const fetchReplies = async () => {
    try {
      const data = await apiRequest(
        `/api/comments?postId=${postId}&parentCommentId=${comment.id}`,
        { method: 'GET' }
      );
      setReplies(data);
    } catch (error) {
      console.error('Failed to fetch replies:', error);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const reply = await apiRequest('/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          postId,
          userId: user?.id || 5,
          content: replyText,
          parentCommentId: comment.id,
        }),
      });
      setReplies([...replies, reply]);
      setReplyText('');
      setShowReply(false);
    } catch (error) {
      console.error('Failed to post reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Link href={`/profile/${comment.userId}`}>
          <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={author?.avatar || ''} alt={author?.name || 'User'} />
            <AvatarFallback>{author?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/profile/${comment.userId}`} className="hover:underline">
                <span className="font-semibold text-sm">{author?.name || 'Loading...'}</span>
              </Link>
              <Badge variant="secondary" className="text-xs">
                {author?.role || ''}
              </Badge>
            </div>
            <p className="text-sm">{comment.content}</p>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
            <button
              className="hover:text-foreground transition-colors font-medium"
              onClick={() => setShowReply(!showReply)}
            >
              Reply
            </button>
          </div>

          {/* Reply Form */}
          {showReply && (
            <div className="mt-3 flex gap-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                disabled={isSubmitting}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={handleReplySubmit}
                disabled={isSubmitting || !replyText.trim()}
                className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}

          {/* Nested Replies */}
          {replies.length > 0 && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-border">
              {replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} postId={postId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}