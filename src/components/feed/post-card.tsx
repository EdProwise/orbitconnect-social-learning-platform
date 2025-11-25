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
  ArrowRight
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
  ARTICLE: { action: 'published an article', icon: FileText, color: 'text-blue-600' },
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
  const [showFullArticle, setShowFullArticle] = useState(false);

  // Get current user
  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isAuthor = currentUser && currentUser.id === post.userId;

  useEffect(() => {
    fetchAuthor();
    fetchReactions();
    fetchKnowledgePoints();
    if (post.type === 'POLL' && post.pollOptions) {
      initializePollVotes();
    }
  }, [post.id]);

  const fetchKnowledgePoints = () => {
    // Simulate fetching knowledge points
    setKnowledgePoints(Math.floor(Math.random() * 100));
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
    if (userKnowledgePoints + points > 100) {
      toast.error('Maximum 100 knowledge points can be awarded per post');
      return;
    }

    try {
      setUserKnowledgePoints(userKnowledgePoints + points);
      setKnowledgePoints(knowledgePoints + points);
      setShowKnowledgeDialog(false);
      toast.success(`Awarded ${points} knowledge points!`);
    } catch (error) {
      console.error('Failed to award knowledge points:', error);
      toast.error('Failed to award knowledge points');
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
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      await apiRequest('/api/reactions', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          userId: user?.id || 5,
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

  const handleSave = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (isSaved) {
        // TODO: Unsave post
      } else {
        await apiRequest('/api/saved-posts', {
          method: 'POST',
          body: JSON.stringify({
            userId: user?.id || 5,
            postId: post.id,
          }),
        });
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Failed to save post:', error);
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
              <h2 className="text-3xl font-bold font-poppins mb-4 leading-tight">
                {post.title}
              </h2>
              
              {post.content && (
                <>
                  {showFullArticle ? (
                    <div 
                      className="prose prose-lg max-w-none mb-6"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  ) : (
                    <>
                      <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                        {extractTextFromHtml(post.content, 300)}
                      </p>
                      <Link href={`/post/${post.id}`}>
                        <Button
                          variant="ghost"
                          className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold"
                        >
                          Read full article
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </>
                  )}
                  {showFullArticle && (
                    <Button
                      variant="ghost"
                      className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold mt-4"
                      onClick={() => setShowFullArticle(false)}
                    >
                      Show less
                    </Button>
                  )}
                </>
              )}
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
            
            <Button variant="ghost" size="sm" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleSave}
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
                Award knowledge points to recognize quality content (max 100 points per post)
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
                {post.mediaUrls.slice(0, 4).map((url, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg overflow-hidden bg-muted ${
                      post.mediaUrls!.length === 1 ? 'aspect-video' : 'aspect-square'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
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
                {post.fileUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{url.split('/').pop() || 'Download file'}</span>
                  </a>
                ))}
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
          
          <Button variant="ghost" size="sm" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={handleSave}
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
              Award knowledge points to recognize quality content (max 100 points per post)
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
}'use client';

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
  ArrowRight
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
  ARTICLE: { action: 'published an article', icon: FileText, color: 'text-blue-600' },
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
  const [showFullArticle, setShowFullArticle] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Get current user
  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isAuthor = currentUser && currentUser.id === post.userId;

  useEffect(() => {
    fetchAuthor();
    fetchReactions();
    fetchKnowledgePoints();
    if (post.type === 'POLL' && post.pollOptions) {
      initializePollVotes();
    }
  }, [post.id]);

  const fetchKnowledgePoints = () => {
    // Simulate fetching knowledge points
    setKnowledgePoints(Math.floor(Math.random() * 100));
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
    if (userKnowledgePoints + points > 100) {
      toast.error('Maximum 100 knowledge points can be awarded per post');
      return;
    }

    try {
      setUserKnowledgePoints(userKnowledgePoints + points);
      setKnowledgePoints(knowledgePoints + points);
      setShowKnowledgeDialog(false);
      toast.success(`Awarded ${points} knowledge points!`);
    } catch (error) {
      console.error('Failed to award knowledge points:', error);
      toast.error('Failed to award knowledge points');
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
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      await apiRequest('/api/reactions', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          userId: user?.id || 5,
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

  const handleSave = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (isSaved) {
        // TODO: Unsave post
      } else {
        await apiRequest('/api/saved-posts', {
          method: 'POST',
          body: JSON.stringify({
            userId: user?.id || 5,
            postId: post.id,
          }),
        });
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Failed to save post:', error);
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
              <h2 className="text-3xl font-bold font-poppins mb-4 leading-tight">
                {post.title}
              </h2>
              
              {post.content && (
                <>
                  {showFullArticle ? (
                    <div 
                      className="prose prose-lg max-w-none mb-6"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  ) : (
                    <>
                      <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                        {extractTextFromHtml(post.content, 300)}
                      </p>
                      <Button
                        variant="ghost"
                        className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold"
                        onClick={() => setShowFullArticle(true)}
                      >
                        Read full article
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  )}
                  {showFullArticle && (
                    <Button
                      variant="ghost"
                      className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold mt-4"
                      onClick={() => setShowFullArticle(false)}
                    >
                      Show less
                    </Button>
                  )}
                </>
              )}
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
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleSave}
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
                Award knowledge points to recognize quality content (max 100 points per post)
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
                {post.mediaUrls.slice(0, 4).map((url, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg overflow-hidden bg-muted ${
                      post.mediaUrls!.length === 1 ? 'aspect-video' : 'aspect-square'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
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
                {post.fileUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{url.split('/').pop() || 'Download file'}</span>
                  </a>
                ))}
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
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={handleSave}
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
              Award knowledge points to recognize quality content (max 100 points per post)
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
}'use client';

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
  ArrowRight
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
  const [showFullArticle, setShowFullArticle] = useState(false);

  // Get current user
  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isAuthor = currentUser && currentUser.id === post.userId;

  useEffect(() => {
    fetchAuthor();
    fetchReactions();
    fetchKnowledgePoints();
    if (post.type === 'POLL' && post.pollOptions) {
      initializePollVotes();
    }
  }, [post.id]);

  const fetchKnowledgePoints = () => {
    // Simulate fetching knowledge points
    setKnowledgePoints(Math.floor(Math.random() * 100));
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
    if (userKnowledgePoints + points > 100) {
      toast.error('Maximum 100 knowledge points can be awarded per post');
      return;
    }

    try {
      setUserKnowledgePoints(userKnowledgePoints + points);
      setKnowledgePoints(knowledgePoints + points);
      setShowKnowledgeDialog(false);
      toast.success(`Awarded ${points} knowledge points!`);
    } catch (error) {
      console.error('Failed to award knowledge points:', error);
      toast.error('Failed to award knowledge points');
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
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      await apiRequest('/api/reactions', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          userId: user?.id || 5,
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

  const handleSave = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (isSaved) {
        // TODO: Unsave post
      } else {
        await apiRequest('/api/saved-posts', {
          method: 'POST',
          body: JSON.stringify({
            userId: user?.id || 5,
            postId: post.id,
          }),
        });
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Failed to save post:', error);
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
              <h2 className="text-3xl font-bold font-poppins mb-4 leading-tight">
                {post.title}
              </h2>
              
              {post.content && (
                <>
                  {showFullArticle ? (
                    <div 
                      className="prose prose-lg max-w-none mb-6"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  ) : (
                    <>
                      <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                        {extractTextFromHtml(post.content, 300)}
                      </p>
                      <Button
                        variant="ghost"
                        className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold"
                        onClick={() => setShowFullArticle(true)}
                      >
                        Read full article
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  )}
                  {showFullArticle && (
                    <Button
                      variant="ghost"
                      className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold mt-4"
                      onClick={() => setShowFullArticle(false)}
                    >
                      Show less
                    </Button>
                  )}
                </>
              )}
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
            
            <Button variant="ghost" size="sm" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleSave}
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
                Award knowledge points to recognize quality content (max 100 points per post)
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
                {post.mediaUrls.slice(0, 4).map((url, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg overflow-hidden bg-muted ${
                      post.mediaUrls!.length === 1 ? 'aspect-video' : 'aspect-square'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
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
                {post.fileUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{url.split('/').pop() || 'Download file'}</span>
                  </a>
                ))}
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
          
          <Button variant="ghost" size="sm" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={handleSave}
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
              Award knowledge points to recognize quality content (max 100 points per post)
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
}'use client';

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
  ArrowRight
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
  ARTICLE: { action: 'published an article', icon: FileText, color: 'text-blue-600' },
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
  const [showFullArticle, setShowFullArticle] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Get current user
  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isAuthor = currentUser && currentUser.id === post.userId;

  useEffect(() => {
    fetchAuthor();
    fetchReactions();
    fetchKnowledgePoints();
    if (post.type === 'POLL' && post.pollOptions) {
      initializePollVotes();
    }
  }, [post.id]);

  const fetchKnowledgePoints = () => {
    // Simulate fetching knowledge points
    setKnowledgePoints(Math.floor(Math.random() * 100));
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
    if (userKnowledgePoints + points > 100) {
      toast.error('Maximum 100 knowledge points can be awarded per post');
      return;
    }

    try {
      setUserKnowledgePoints(userKnowledgePoints + points);
      setKnowledgePoints(knowledgePoints + points);
      setShowKnowledgeDialog(false);
      toast.success(`Awarded ${points} knowledge points!`);
    } catch (error) {
      console.error('Failed to award knowledge points:', error);
      toast.error('Failed to award knowledge points');
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
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      await apiRequest('/api/reactions', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          userId: user?.id || 5,
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

  const handleSave = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (isSaved) {
        // TODO: Unsave post
      } else {
        await apiRequest('/api/saved-posts', {
          method: 'POST',
          body: JSON.stringify({
            userId: user?.id || 5,
            postId: post.id,
          }),
        });
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Failed to save post:', error);
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
              <h2 className="text-3xl font-bold font-poppins mb-4 leading-tight">
                {post.title}
              </h2>
              
              {post.content && (
                <>
                  {showFullArticle ? (
                    <div 
                      className="prose prose-lg max-w-none mb-6"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  ) : (
                    <>
                      <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                        {extractTextFromHtml(post.content, 300)}
                      </p>
                      <Button
                        variant="ghost"
                        className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold"
                        onClick={() => setShowFullArticle(true)}
                      >
                        Read full article
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  )}
                  {showFullArticle && (
                    <Button
                      variant="ghost"
                      className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold mt-4"
                      onClick={() => setShowFullArticle(false)}
                    >
                      Show less
                    </Button>
                  )}
                </>
              )}
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
            
            <Button variant="ghost" size="sm" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleSave}
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
                Award knowledge points to recognize quality content (max 100 points per post)
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
                {post.mediaUrls.slice(0, 4).map((url, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg overflow-hidden bg-muted ${
                      post.mediaUrls!.length === 1 ? 'aspect-video' : 'aspect-square'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
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
                {post.fileUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{url.split('/').pop() || 'Download file'}</span>
                  </a>
                ))}
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
          
          <Button variant="ghost" size="sm" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={handleSave}
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
              Award knowledge points to recognize quality content (max 100 points per post)
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
}'use client';

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
  ArrowRight
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
  ARTICLE: { action: 'published an article', icon: FileText, color: 'text-blue-600' },
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
  const [showFullArticle, setShowFullArticle] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Get current user
  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isAuthor = currentUser && currentUser.id === post.userId;

  useEffect(() => {
    fetchAuthor();
    fetchReactions();
    fetchKnowledgePoints();
    if (post.type === 'POLL' && post.pollOptions) {
      initializePollVotes();
    }
  }, [post.id]);

  const fetchKnowledgePoints = () => {
    // Simulate fetching knowledge points
    setKnowledgePoints(Math.floor(Math.random() * 100));
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
    if (userKnowledgePoints + points > 100) {
      toast.error('Maximum 100 knowledge points can be awarded per post');
      return;
    }

    try {
      setUserKnowledgePoints(userKnowledgePoints + points);
      setKnowledgePoints(knowledgePoints + points);
      setShowKnowledgeDialog(false);
      toast.success(`Awarded ${points} knowledge points!`);
    } catch (error) {
      console.error('Failed to award knowledge points:', error);
      toast.error('Failed to award knowledge points');
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
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      await apiRequest('/api/reactions', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          userId: user?.id || 5,
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

  const handleSave = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (isSaved) {
        // TODO: Unsave post
      } else {
        await apiRequest('/api/saved-posts', {
          method: 'POST',
          body: JSON.stringify({
            userId: user?.id || 5,
            postId: post.id,
          }),
        });
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Failed to save post:', error);
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
              <h2 className="text-3xl font-bold font-poppins mb-4 leading-tight">
                {post.title}
              </h2>
              
              {post.content && (
                <>
                  {showFullArticle ? (
                    <div 
                      className="prose prose-lg max-w-none mb-6"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  ) : (
                    <>
                      <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                        {extractTextFromHtml(post.content, 300)}
                      </p>
                      <Button
                        variant="ghost"
                        className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold"
                        onClick={() => setShowFullArticle(true)}
                      >
                        Read full article
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  )}
                  {showFullArticle && (
                    <Button
                      variant="ghost"
                      className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold mt-4"
                      onClick={() => setShowFullArticle(false)}
                    >
                      Show less
                    </Button>
                  )}
                </>
              )}
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
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleSave}
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
                Award knowledge points to recognize quality content (max 100 points per post)
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
                {post.mediaUrls.slice(0, 4).map((url, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg overflow-hidden bg-muted ${
                      post.mediaUrls!.length === 1 ? 'aspect-video' : 'aspect-square'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
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
                {post.fileUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{url.split('/').pop() || 'Download file'}</span>
                  </a>
                ))}
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
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={handleSave}
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
              Award knowledge points to recognize quality content (max 100 points per post)
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
}'use client';

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
  ArrowRight
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
  ARTICLE: { action: 'published an article', icon: FileText, color: 'text-blue-600' },
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
  const [showFullArticle, setShowFullArticle] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Get current user
  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isAuthor = currentUser && currentUser.id === post.userId;

  useEffect(() => {
    fetchAuthor();
    fetchReactions();
    fetchKnowledgePoints();
    if (post.type === 'POLL' && post.pollOptions) {
      initializePollVotes();
    }
    // Set share URL
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/post/${post.id}`);
    }
  }, [post.id]);

  const fetchKnowledgePoints = () => {
    // Simulate fetching knowledge points
    setKnowledgePoints(Math.floor(Math.random() * 100));
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
    if (userKnowledgePoints + points > 100) {
      toast.error('Maximum 100 knowledge points can be awarded per post');
      return;
    }

    try {
      setUserKnowledgePoints(userKnowledgePoints + points);
      setKnowledgePoints(knowledgePoints + points);
      setShowKnowledgeDialog(false);
      toast.success(`Awarded ${points} knowledge points!`);
    } catch (error) {
      console.error('Failed to award knowledge points:', error);
      toast.error('Failed to award knowledge points');
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
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      await apiRequest('/api/reactions', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          userId: user?.id || 5,
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

  const handleSave = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (isSaved) {
        // TODO: Unsave post
      } else {
        await apiRequest('/api/saved-posts', {
          method: 'POST',
          body: JSON.stringify({
            userId: user?.id || 5,
            postId: post.id,
          }),
        });
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Failed to save post:', error);
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
              <h2 className="text-3xl font-bold font-poppins mb-4 leading-tight">
                {post.title}
              </h2>
              
              {post.content && (
                <>
                  {showFullArticle ? (
                    <div 
                      className="prose prose-lg max-w-none mb-6"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  ) : (
                    <>
                      <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                        {extractTextFromHtml(post.content, 300)}
                      </p>
                      <Button
                        variant="ghost"
                        className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold"
                        onClick={() => setShowFullArticle(true)}
                      >
                        Read full article
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  )}
                  {showFullArticle && (
                    <Button
                      variant="ghost"
                      className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold mt-4"
                      onClick={() => setShowFullArticle(false)}
                    >
                      Show less
                    </Button>
                  )}
                </>
              )}
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
            
            <Button variant="ghost" size="sm" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleSave}
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
                Award knowledge points to recognize quality content (max 100 points per post)
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
                {post.mediaUrls.slice(0, 4).map((url, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg overflow-hidden bg-muted ${
                      post.mediaUrls!.length === 1 ? 'aspect-video' : 'aspect-square'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
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
                {post.fileUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{url.split('/').pop() || 'Download file'}</span>
                  </a>
                ))}
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
          
          <Button variant="ghost" size="sm" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={handleSave}
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
              Award knowledge points to recognize quality content (max 100 points per post)
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
}'use client';

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
  ArrowRight
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
  ARTICLE: { action: 'published an article', icon: FileText, color: 'text-blue-600' },
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
  const [showFullArticle, setShowFullArticle] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Get current user
  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isAuthor = currentUser && currentUser.id === post.userId;

  useEffect(() => {
    fetchAuthor();
    fetchReactions();
    fetchKnowledgePoints();
    if (post.type === 'POLL' && post.pollOptions) {
      initializePollVotes();
    }
  }, [post.id]);

  const fetchKnowledgePoints = () => {
    // Simulate fetching knowledge points
    setKnowledgePoints(Math.floor(Math.random() * 100));
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
    if (userKnowledgePoints + points > 100) {
      toast.error('Maximum 100 knowledge points can be awarded per post');
      return;
    }

    try {
      setUserKnowledgePoints(userKnowledgePoints + points);
      setKnowledgePoints(knowledgePoints + points);
      setShowKnowledgeDialog(false);
      toast.success(`Awarded ${points} knowledge points!`);
    } catch (error) {
      console.error('Failed to award knowledge points:', error);
      toast.error('Failed to award knowledge points');
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
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      await apiRequest('/api/reactions', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          userId: user?.id || 5,
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

  const handleSave = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (isSaved) {
        // TODO: Unsave post
      } else {
        await apiRequest('/api/saved-posts', {
          method: 'POST',
          body: JSON.stringify({
            userId: user?.id || 5,
            postId: post.id,
          }),
        });
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Failed to save post:', error);
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
              <h2 className="text-3xl font-bold font-poppins mb-4 leading-tight">
                {post.title}
              </h2>
              
              {post.content && (
                <>
                  {showFullArticle ? (
                    <div 
                      className="prose prose-lg max-w-none mb-6"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  ) : (
                    <>
                      <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                        {extractTextFromHtml(post.content, 300)}
                      </p>
                      <Button
                        variant="ghost"
                        className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold"
                        onClick={() => setShowFullArticle(true)}
                      >
                        Read full article
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  )}
                  {showFullArticle && (
                    <Button
                      variant="ghost"
                      className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold mt-4"
                      onClick={() => setShowFullArticle(false)}
                    >
                      Show less
                    </Button>
                  )}
                </>
              )}
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
            
            <Button variant="ghost" size="sm" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleSave}
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
                Award knowledge points to recognize quality content (max 100 points per post)
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
                Share Article
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => handleShare('copy')}
                >
                  Copy
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleShare('twitter')}
                  className="justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare('facebook')}
                  className="justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare('linkedin')}
                  className="justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare('whatsapp')}
                  className="justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp
                </Button>
              </div>
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
                {post.mediaUrls.slice(0, 4).map((url, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg overflow-hidden bg-muted ${
                      post.mediaUrls!.length === 1 ? 'aspect-video' : 'aspect-square'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
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
                {post.fileUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{url.split('/').pop() || 'Download file'}</span>
                  </a>
                ))}
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
          
          <Button variant="ghost" size="sm" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={handleSave}
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
              Award knowledge points to recognize quality content (max 100 points per post)
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
              Share Article
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => handleShare('copy')}
              >
                Copy
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleShare('twitter')}
                className="justify-start"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('facebook')}
                className="justify-start"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('linkedin')}
                className="justify-start"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('whatsapp')}
                className="justify-start"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </Button>
            </div>
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
}'use client';

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
  ArrowRight
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
  ARTICLE: { action: 'published an article', icon: FileText, color: 'text-blue-600' },
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
  const [showFullArticle, setShowFullArticle] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Get current user
  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isAuthor = currentUser && currentUser.id === post.userId;

  useEffect(() => {
    fetchAuthor();
    fetchReactions();
    fetchKnowledgePoints();
    if (post.type === 'POLL' && post.pollOptions) {
      initializePollVotes();
    }
  }, [post.id]);

  const fetchKnowledgePoints = () => {
    // Simulate fetching knowledge points
    setKnowledgePoints(Math.floor(Math.random() * 100));
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
    if (userKnowledgePoints + points > 100) {
      toast.error('Maximum 100 knowledge points can be awarded per post');
      return;
    }

    try {
      setUserKnowledgePoints(userKnowledgePoints + points);
      setKnowledgePoints(knowledgePoints + points);
      setShowKnowledgeDialog(false);
      toast.success(`Awarded ${points} knowledge points!`);
    } catch (error) {
      console.error('Failed to award knowledge points:', error);
      toast.error('Failed to award knowledge points');
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
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      await apiRequest('/api/reactions', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          userId: user?.id || 5,
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

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    }
    setShowShareDialog(false);
  };

  const handleSave = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (isSaved) {
        // TODO: Unsave post
      } else {
        await apiRequest('/api/saved-posts', {
          method: 'POST',
          body: JSON.stringify({
            userId: user?.id || 5,
            postId: post.id,
          }),
        });
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Failed to save post:', error);
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
              <h2 className="text-3xl font-bold font-poppins mb-4 leading-tight">
                {post.title}
              </h2>
              
              {post.content && (
                <>
                  {showFullArticle ? (
                    <div 
                      className="prose prose-lg max-w-none mb-6"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  ) : (
                    <>
                      <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                        {extractTextFromHtml(post.content, 300)}
                      </p>
                      <Button
                        variant="ghost"
                        className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold"
                        onClick={() => setShowFullArticle(true)}
                      >
                        Read full article
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  )}
                  {showFullArticle && (
                    <Button
                      variant="ghost"
                      className="text-[#854cf4] hover:text-[#7743e0] hover:bg-[#854cf4]/10 p-0 h-auto font-semibold mt-4"
                      onClick={() => setShowFullArticle(false)}
                    >
                      Show less
                    </Button>
                  )}
                </>
              )}
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
            
            <Button variant="ghost" size="sm" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={handleSave}
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
                Award knowledge points to recognize quality content (max 100 points per post)
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
                {post.mediaUrls.slice(0, 4).map((url, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg overflow-hidden bg-muted ${
                      post.mediaUrls!.length === 1 ? 'aspect-video' : 'aspect-square'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
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
                {post.fileUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{url.split('/').pop() || 'Download file'}</span>
                  </a>
                ))}
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
          
          <Button variant="ghost" size="sm" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={handleSave}
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
              Award knowledge points to recognize quality content (max 100 points per post)
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