'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  BookOpen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/api-client';

interface Post {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string | null;
  mediaUrls: string[] | null;
  pollOptions: string[] | null;
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

  useEffect(() => {
    fetchAuthor();
    fetchReactions();
  }, [post.id]);

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

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const comment = await apiRequest('/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          userId: 5, // TODO: Get from auth context
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
          postId: post.id,
          userId: 5, // TODO: Get from auth context
          type,
        }),
      });
      fetchReactions();
      setUserReaction(type);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (isSaved) {
        // TODO: Unsave post
      } else {
        await apiRequest('/api/saved-posts', {
          method: 'POST',
          body: JSON.stringify({
            userId: 5, // TODO: Get from auth context
            postId: post.id,
          }),
        });
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Failed to save post:', error);
    }
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

  return (
    <Card>
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={author?.avatar || ''} alt={author?.name || 'User'} />
            <AvatarFallback>{author?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{author?.name || 'Loading...'}</span>
              <Badge variant="secondary" className="text-xs">
                {author?.role || ''}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              <span>•</span>
              <Badge variant="outline" className="text-xs">
                {post.type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        {/* Post Content */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{post.title}</h3>
          {post.content && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
          )}

          {/* Media */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.mediaUrls.slice(0, 4).map((url, index) => (
                <div key={index} className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Poll */}
          {post.pollOptions && post.pollOptions.length > 0 && (
            <div className="space-y-2">
              {post.pollOptions.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                >
                  <span className="text-sm">{option}</span>
                </Button>
              ))}
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
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">{url.split('/').pop()}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Reactions Summary */}
        <div className="flex items-center gap-4 pt-4 mt-4 border-t border-border text-xs text-muted-foreground">
          <span>{reactions.length} reactions</span>
          <span>{comments.length} comments</span>
          <span>{post.viewCount} views</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-border mt-2">
          {reactionTypes.map((reaction) => {
            const Icon = reaction.icon;
            const count = getReactionCount(reaction.type);
            const isActive = userReaction === reaction.type;

            return (
              <Button
                key={reaction.type}
                variant="ghost"
                size="sm"
                className={`flex-1 ${isActive ? reaction.color : ''}`}
                onClick={() => handleReaction(reaction.type)}
              >
                <Icon className="w-4 h-4 mr-1" />
                <span className="text-xs">{count > 0 ? count : reaction.label}</span>
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={toggleComments}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Comment
          </Button>
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
      const reply = await apiRequest('/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          postId,
          userId: 5, // TODO: Get from auth context
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
        <Avatar className="w-8 h-8">
          <AvatarImage src={author?.avatar || ''} alt={author?.name || 'User'} />
          <AvatarFallback>{author?.name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{author?.name || 'Loading...'}</span>
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