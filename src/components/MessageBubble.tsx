import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Trash2 } from 'lucide-react';

interface Sender {
  _id: string;
  displayName: string;
  avatarColor: string;
}

interface Message {
  _id: string;
  content: string;
  senderId: string;
  sender: Sender | null;
  createdAt: number;
  readBy: string[];
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  currentUserId: string;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  isFirstInGroup,
  isLastInGroup,
  currentUserId,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteMessage = useMutation(api.messages.deleteMessage);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return;
    setIsDeleting(true);
    try {
      await deleteMessage({
        messageId: message._id as any,
        userId: currentUserId as any,
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  // Determine border radius based on position in message group
  const getBorderRadius = () => {
    if (isOwn) {
      if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-br-md';
      if (isFirstInGroup) return 'rounded-2xl rounded-br-md';
      if (isLastInGroup) return 'rounded-2xl rounded-tr-md rounded-br-md';
      return 'rounded-2xl rounded-r-md';
    } else {
      if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-bl-md';
      if (isFirstInGroup) return 'rounded-2xl rounded-bl-md';
      if (isLastInGroup) return 'rounded-2xl rounded-tl-md rounded-bl-md';
      return 'rounded-2xl rounded-l-md';
    }
  };

  return (
    <div
      className={`flex items-end gap-2 animate-fade-in ${
        isOwn ? 'justify-end' : 'justify-start'
      } ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}
    >
      {/* Avatar (only for others, only on first message of group) */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0">
          {showAvatar && message.sender && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: message.sender.avatarColor }}
            >
              {message.sender.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[70%] ${isOwn ? 'order-1' : ''}`}>
        {/* Sender name (only for group chats, first message) */}
        {!isOwn && isFirstInGroup && message.sender && (
          <p className="text-xs text-gray mb-1 ml-1">{message.sender.displayName}</p>
        )}

        <div
          className={`relative group px-4 py-2.5 ${getBorderRadius()} ${
            isOwn
              ? 'bg-charcoal text-cream'
              : 'bg-white text-charcoal border border-border'
          } ${isDeleting ? 'opacity-50' : ''}`}
          onMouseEnter={() => isOwn && setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {message.content}
          </p>

          {/* Delete button - only for own messages */}
          {isOwn && showMenu && !isDeleting && (
            <button
              onClick={handleDelete}
              className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-border rounded-lg
                       text-gray hover:text-red hover:border-red transition-colors shadow-sm"
              title="Delete message"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Time (only on last message of group) */}
        {isLastInGroup && (
          <p className={`text-xs text-gray mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
            {formatTime(message.createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}
