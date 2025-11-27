'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  ArrowLeft,
  Zap,
  BookOpen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest, ApiError, authApi } from '@/lib/api-client';
import { toast } from 'sonner';

interface Post {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string | null;
  mediaUrls: string[] | null;
  viewCount: number;
  createdAt: string;
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

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<UserData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [reactions, setReactions] = useState<any[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [knowledgePoints, setKnowledgePoints] = useState(0);
  const [userKnowledgePoints, setUserKnowledgePoints] = useState(0);
  const [showKnowledgeDialog, setShowKnowledgeDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    // Resolve current user id for saved/unsave actions
    const resolveUser = async () => {
      try {
        if (currentUser?.id) {
          setCurrentUserId(currentUser.id);
          return;
        }
        const me = await authApi.getCurrentUser();
        if ((me as any)?.id) setCurrentUserId((me as any).id);
      } catch {
        // ignore
      }
    };
    resolveUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  useEffect(() => {
    // Initialize saved state when we have both ids
    if (!postId || currentUserId == null) return;
    refreshSavedStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, currentUserId]);

  const refreshSavedStatus = async () => {
    try {
      const result = await apiRequest<any[]>(`/api/saved-posts?userId=${currentUserId}&postId=${postId}&limit=1`, { method: 'GET' });
      if (Array.isArray(result) && result.length > 0) {
        setIsSaved(true);
        setSavedRecordId(result[0].id);
      } else {
        setIsSaved(false);
        setSavedRecordId(null);
      }
    } catch (e) {
      // do nothing
    }
  };

  const fetchPost = async () => {
    setIsLoadingPost(true);
    try {
      const data = await apiRequest(`/api/posts?id=${postId}`, { method: 'GET' });
      setPost(data);
      
      if (data.userId) {
        fetchAuthor(data.userId);
      }
      
      fetchReactions();
      fetchComments();
      fetchKnowledgePoints();
      fetchUserKnowledgePoints();
    } catch (error) {
      console.error('Failed to fetch post:', error);
      toast.error('Failed to load article');
    } finally {
      setIsLoadingPost(false);
    }
  };

  const fetchAuthor = async (userId: number) => {
    try {
      const data = await apiRequest(`/api/users?id=${userId}`, { method: 'GET' });
      setAuthor(data);
    } catch (error) {
      console.error('Failed to fetch author:', error);
    }
  };

  const fetchReactions = async () => {
    try {
      const data = await apiRequest(`/api/reactions?postId=${postId}`, { method: 'GET' });
      setReactions(data);
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
    }
  };

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const data = await apiRequest(`/api/comments?postId=${postId}&parentCommentId=null`, { 
        method: 'GET' 
      });
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const fetchKnowledgePoints = async () => {
    try {
      const data = await apiRequest(`/api/knowledge-points?postId=${postId}`, { method: 'GET' });
      setKnowledgePoints(data.postTotalPoints || 0);
    } catch (error) {
      console.error('Failed to fetch knowledge points:', error);
    }
  };

  const fetchUserKnowledgePoints = async () => {
    if (!currentUser) return;
    
    try {
      const data = await apiRequest(`/api/knowledge-points?postId=${postId}&awarderId=${currentUser.id}`, { 
        method: 'GET' 
      });
      setUserKnowledgePoints(data.totalPointsAwarded || 0);
    } catch (error) {
      console.error('Failed to fetch user knowledge points:', error);
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
          postId: parseInt(postId),
          awarderId: currentUser.id,
          points: points,
        }),
      });

      setUserKnowledgePoints(data.totalPointsAwarded);
      setKnowledgePoints(data.postTotalPoints);
      setShowKnowledgeDialog(false);
      toast.success(`Awarded ${points} knowledge points!`);
    } catch (error: any) {
      console.error('Failed to award knowledge points:', error);
      
      if ((error as any).message && (error as any).message.includes('already awarded')) {
        toast.error('You have already reached the maximum points for this post');
      } else if ((error as any).message && (error as any).message.includes('your own post')) {
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
      const comment = await apiRequest('/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          postId: parseInt(postId),
          userId: currentUser?.id || 5,
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
    try {
      await apiRequest('/api/reactions', {
        method: 'POST',
        body: JSON.stringify({
          postId: parseInt(postId),
          userId: currentUser?.id || 5,
          type,
        }),
      });
      fetchReactions();
      setUserReaction(type);
      setShowReactionPicker(false);
      toast.success(`Reacted with ${type.toLowerCase()}`);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const handleSave = async () => {
    if (currentUserId == null) {
      toast.error('Please log in to save posts');
      return;
    }
    if (isSaving) return;
    setIsSaving(true);

    try {
      if (isSaved && savedRecordId != null) {
        // Unsave: delete the saved record by id
        await apiRequest(`/api/saved-posts?id=${savedRecordId}`, { method: 'DELETE' });
        toast.success('Removed from saved');
      } else {
        // Save: create saved record
        await apiRequest('/api/saved-posts', {
          method: 'POST',
          body: JSON.stringify({
            userId: currentUserId,
            postId: parseInt(postId),
          }),
        });
        toast.success('Saved');
      }
    } catch (error) {
      const err = error as ApiError;
      if (err?.code === 'DUPLICATE_SAVE') {
        // Already saved; ensure state reflects it
        toast.message?.('Already saved');
      } else {
        console.error('Failed to toggle save:', error);
        toast.error('Failed to update saved state');
      }
    } finally {
      // Refresh status and notify Saved page
      await refreshSavedStatus();
      window.dispatchEvent(new Event('savedPostsUpdated'));
      setIsSaving(false);
    }
  };

  const isAuthor = currentUser && post && currentUser.id === post.userId;

  if (isLoadingPost) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#854cf4]" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Article not found</p>
          <Button
            onClick={() => router.push('/feed')}
            className="mt-4 bg-[#854cf4] hover:bg-[#7743e0] text-white"
          >
            Back to Feed
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/feed">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>
      </Link>

      {/* Article Card */}
      <Card className="overflow-hidden">
        {/* Cover Image */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="relative w-full h-96 overflow-hidden">
            <img 
              src={post.mediaUrls[0]} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
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
          </div>

          {/* Article Title */}
          <h1 className="text-4xl font-bold font-poppins mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Article Content */}
          {post.content && (
            <div 
              className="prose prose-lg max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 py-4 my-6 border-y border-border text-sm text-muted-foreground">
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
          <div className="flex items-center gap-2 mb-6">
            <div className="relative flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full ${userReaction === 'LIKE' ? 'text-blue-500' : ''}`}
                onClick={() => setShowReactionPicker(!showReactionPicker)}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                <span className="text-xs">
                  {userReaction ? reactionTypes.find(r => r.type === userReaction)?.label : 'Like'}
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
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{reaction.label}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

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
            
            <Button variant="ghost" size="sm" className="flex-1">
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
          <div className="space-y-4 pt-6 border-t border-border">
            <h3 className="text-lg font-semibold">Comments</h3>
            
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
                  <CommentItem key={comment.id} comment={comment} postId={parseInt(postId)} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
    </div>
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