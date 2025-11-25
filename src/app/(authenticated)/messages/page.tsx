'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  readAt: string | null;
  createdAt: string;
}

interface Conversation {
  userId: number;
  user: any;
  lastMessage: Message | null;
  unreadCount: number;
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get current user from localStorage
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
      
      // Check for userId in URL params to start a conversation
      const userIdParam = searchParams?.get('userId');
      if (userIdParam) {
        setSelectedConversation(parseInt(userIdParam));
      }
    }
  }, [currentUserId, searchParams]);

  useEffect(() => {
    if (selectedConversation && currentUserId) {
      fetchMessages(selectedConversation);
      
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => fetchMessages(selectedConversation), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    if (!currentUserId) return;
    
    try {
      const connectionsData = await apiRequest(
        `/api/connections?userId=${currentUserId}&status=ACCEPTED`,
        { method: 'GET' }
      );

      const conversationsData = await Promise.all(
        connectionsData.map(async (conn: any) => {
          const otherUserId = conn.requesterId === currentUserId ? conn.receiverId : conn.requesterId;
          const userData = await apiRequest(`/api/users?id=${otherUserId}`, { method: 'GET' });
          
          // Get last message
          const messagesData = await apiRequest(
            `/api/messages?conversationWith=${otherUserId}&limit=1`,
            { method: 'GET' }
          );

          // Filter to get actual last message between these two users
          const relevantMessages = messagesData.filter(
            (msg: Message) =>
              (msg.senderId === currentUserId && msg.receiverId === otherUserId) ||
              (msg.senderId === otherUserId && msg.receiverId === currentUserId)
          );

          return {
            userId: otherUserId,
            user: userData,
            lastMessage: relevantMessages[0] || null,
            unreadCount: 0,
          };
        })
      );

      setConversations(conversationsData);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchMessages = async (userId: number) => {
    if (!currentUserId) return;
    
    try {
      setIsLoading(true);
      const data = await apiRequest(
        `/api/messages?conversationWith=${userId}&limit=50`,
        { method: 'GET' }
      );
      // Filter to only show messages between current user and selected user
      const filtered = data.filter(
        (msg: Message) =>
          (msg.senderId === currentUserId && msg.receiverId === userId) ||
          (msg.senderId === userId && msg.receiverId === currentUserId)
      );
      setMessages(filtered);
      
      // Mark messages as read
      const unreadMessages = filtered.filter(
        (msg: Message) => msg.senderId === userId && !msg.readAt
      );
      unreadMessages.forEach((msg: Message) => {
        apiRequest(`/api/messages?id=${msg.id}`, {
          method: 'PUT',
          body: JSON.stringify({ readAt: new Date().toISOString() }),
        });
      });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    setIsSending(true);
    try {
      const message = await apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: selectedConversation,
          content: newMessage.trim(),
        }),
      });
      setMessages([...messages, message]);
      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <Card className="h-full">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-80 border-r border-border">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold font-poppins mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search messages..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-7rem)]">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {searchQuery ? 'No conversations found' : 'No connections yet. Connect with people to start messaging!'}
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedConversation(conv.userId)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-accent transition-colors ${
                      selectedConversation === conv.userId ? 'bg-accent' : ''
                    }`}
                  >
                    <Avatar>
                      <AvatarImage src={conv.user.avatar || ''} alt={conv.user.name} />
                      <AvatarFallback>{conv.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm truncate">{conv.user.name}</span>
                        {conv.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                          {conv.lastMessage.content}
                        </p>
                      )}
                      {conv.unreadCount > 0 && (
                        <Badge className="mt-1 bg-[#854cf4] hover:bg-[#854cf4] text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage 
                        src={conversations.find(c => c.userId === selectedConversation)?.user.avatar || ''} 
                        alt="User" 
                      />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {conversations.find(c => c.userId === selectedConversation)?.user.name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conversations.find(c => c.userId === selectedConversation)?.user.role || ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isOwn={message.senderId === currentUserId}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={isSending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isSending || !newMessage.trim()}
                      className="bg-[#854cf4] hover:bg-[#7743e0] text-white flex-shrink-0"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-[#854cf4] text-white rounded-br-sm'
            : 'bg-muted rounded-bl-sm'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

function MentorSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}