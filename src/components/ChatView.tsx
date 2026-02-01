import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useVoiceCall } from '../contexts/VoiceCallContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Send, ArrowLeft, Phone } from 'lucide-react';
import type { Id } from '../../convex/_generated/dataModel';

interface ChatViewProps {
  conversationId: string;
}

export function ChatView({ conversationId }: ChatViewProps) {
  const { user } = useAuth();
  const { setActiveConversationId } = useChat();
  const { setCurrentCall, isInCall } = useVoiceCall();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversation = useQuery(api.conversations.get, { conversationId } as any);
  const messages = useQuery(api.messages.list, { conversationId } as any);
  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    user ? { conversationId, currentUserId: user._id } as any : "skip"
  );

  const sendMessage = useMutation(api.messages.send);
  const markAsRead = useMutation(api.messages.markAsRead);
  const setTyping = useMutation(api.typing.setTyping);
  const initiateCall = useMutation(api.voiceCalls.initiateCall);

  // Check for active call in this conversation
  const activeCall = useQuery(api.voiceCalls.getActiveCall, { conversationId } as any);

  // Get display info
  const otherParticipant = conversation?.participants.find(
    (p: any) => p && p._id !== user?._id
  );

  const displayName = conversation?.isGroup
    ? conversation.groupName || 'Group Chat'
    : otherParticipant?.displayName || 'Unknown';

  const avatarColor = conversation?.isGroup
    ? '#6A4C93'
    : otherParticipant?.avatarColor || '#6B7280';

  const isOnline = conversation?.isGroup
    ? conversation.participants.some((p: any) => p && p._id !== user?._id && p.isOnline)
    : otherParticipant?.isOnline || false;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (user && conversationId) {
      markAsRead({ conversationId, userId: user._id } as any);
    }
  }, [conversationId, user, markAsRead, messages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!user) return;

    setTyping({ conversationId, userId: user._id, isTyping: true } as any);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping({ conversationId, userId: user._id, isTyping: false } as any);
    }, 2000);
  };

  // Start a voice call
  const handleStartCall = async () => {
    if (!user || isStartingCall || isInCall) return;

    setIsStartingCall(true);
    try {
      const callId = await initiateCall({
        conversationId: conversationId as Id<"conversations">,
        initiatorId: user._id as Id<"users">,
      });

      setCurrentCall({
        callId,
        conversationId: conversationId as Id<"conversations">,
        isInitiator: true,
        callType: conversation?.isGroup ? 'group' : '1-on-1',
      });
    } catch (error) {
      console.error('Failed to start call:', error);
    } finally {
      setIsStartingCall(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !user || isSending) return;

    setIsSending(true);
    const messageText = message.trim();
    setMessage('');

    try {
      await sendMessage({
        conversationId,
        senderId: user._id,
        content: messageText,
      } as any);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessage(messageText);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray/30 border-t-gray rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-cream">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 lg:px-6 py-4 bg-white border-b border-border">
        <button
          onClick={() => setActiveConversationId(null)}
          className="lg:hidden p-2 -ml-2 hover:bg-cream-dark rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-charcoal" />
        </button>

        <div className="relative">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: avatarColor }}
          >
            {conversation.isGroup ? (
              <span>{conversation.participants.length}</span>
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-charcoal truncate">{displayName}</h2>
          <p className="text-sm text-gray">
            {conversation.isGroup
              ? `${conversation.participants.length} members`
              : isOnline
              ? 'Online'
              : 'Offline'
            }
          </p>
        </div>

        {/* Voice call button */}
        <button
          onClick={handleStartCall}
          disabled={isStartingCall || isInCall || !!activeCall}
          className="p-2 hover:bg-cream-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={activeCall ? 'Call in progress' : isInCall ? 'Already in a call' : 'Start voice call'}
        >
          {isStartingCall ? (
            <div className="w-5 h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" />
          ) : (
            <Phone className={`w-5 h-5 ${activeCall ? 'text-green-500' : 'text-charcoal'}`} />
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
        {messages === undefined ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className="h-12 bg-cream-dark rounded-2xl animate-pulse"
                  style={{ width: `${Math.random() * 40 + 30}%` }}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-cream-dark rounded-full flex items-center justify-center">
                <Send className="w-6 h-6 text-gray" />
              </div>
              <p className="text-gray">No messages yet</p>
              <p className="text-gray-light text-sm mt-1">Send the first message!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg: any, index: number) => {
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
              const isFirstInGroup = showAvatar;
              const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
              const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

              return (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isOwn={msg.senderId === user?._id}
                  showAvatar={showAvatar}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  currentUserId={user?._id || ''}
                />
              );
            })}
            {typingUsers && typingUsers.length > 0 && (
              <TypingIndicator users={typingUsers.filter((u: any) => u !== null) as any} />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 lg:px-6 py-4 bg-white border-t border-border">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 bg-cream-dark border border-border rounded-xl resize-none
                       text-charcoal placeholder:text-gray-light
                       focus:outline-none focus:border-charcoal
                       transition-colors"
              style={{
                minHeight: '48px',
                maxHeight: '120px',
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="p-3 bg-charcoal text-cream rounded-xl
                     hover:bg-charcoal-light transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
