import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

interface Participant {
  _id: string;
  displayName: string;
  avatarColor: string;
  isOnline: boolean;
}

interface ConversationData {
  _id: string;
  isGroup: boolean;
  groupName?: string;
  participants: Participant[];
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: number;
  } | null;
  unreadCount: number;
  lastMessageAt: number;
}

interface ConversationItemProps {
  conversation: ConversationData;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const { user } = useAuth();
  const { activeConversationId, setActiveConversationId, setIsMobileMenuOpen } = useChat();

  const isActive = activeConversationId === conversation._id;

  // Get the other participant for 1-on-1 chats
  const otherParticipant = conversation.participants.find(
    (p) => p._id !== user?._id
  );

  const displayName = conversation.isGroup
    ? conversation.groupName || 'Group Chat'
    : otherParticipant?.displayName || 'Unknown';

  const avatarColor = conversation.isGroup
    ? '#6A4C93'
    : otherParticipant?.avatarColor || '#6B7280';

  const isOnline = conversation.isGroup
    ? conversation.participants.some((p) => p._id !== user?._id && p.isOnline)
    : otherParticipant?.isOnline || false;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleClick = () => {
    setActiveConversationId(conversation._id);
    setIsMobileMenuOpen(false);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left
                ${isActive ? 'bg-cream-dark' : 'hover:bg-cream-dark/50'}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
          style={{ backgroundColor: avatarColor }}
        >
          {conversation.isGroup ? (
            <span className="text-lg">{conversation.participants.length}</span>
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-medium truncate ${isActive ? 'text-charcoal' : 'text-charcoal'}`}>
            {displayName}
          </span>
          {conversation.lastMessage && (
            <span className="text-xs text-gray flex-shrink-0">
              {formatTime(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-sm text-gray truncate">
            {conversation.lastMessage?.content || 'No messages yet'}
          </span>
          {conversation.unreadCount > 0 && (
            <span className="flex-shrink-0 w-5 h-5 bg-red rounded-full flex items-center justify-center text-white text-xs font-medium">
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
