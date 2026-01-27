import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { MessageCircle, Plus, Users } from 'lucide-react';

export function EmptyState() {
  const { user } = useAuth();
  const { setActiveConversationId, setShowNewChatModal, setShowNewGroupModal } = useChat();

  const conversations = useQuery(
    api.conversations.list,
    user ? { userId: user._id } as any : "skip"
  );

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

  // Show recent chats if available
  if (conversations && conversations.length > 0) {
    return (
      <div className="h-full flex flex-col bg-cream">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-semibold text-charcoal">Recent Chats</h2>
          <p className="text-gray text-sm mt-1">Tap to continue chatting</p>
        </div>

        {/* Recent chats list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {conversations.slice(0, 10).map((conv: any) => {
              const otherParticipant = conv.participants.find(
                (p: any) => p?._id !== user?._id
              );
              const displayName = conv.isGroup
                ? conv.groupName || 'Group Chat'
                : otherParticipant?.displayName || 'Unknown';
              const avatarColor = conv.isGroup
                ? '#6A4C93'
                : otherParticipant?.avatarColor || '#6B7280';

              return (
                <button
                  key={conv._id}
                  onClick={() => setActiveConversationId(conv._id)}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-xl hover:bg-cream-dark transition-colors text-left"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {conv.isGroup ? (
                      <span>{conv.participants.length}</span>
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-charcoal truncate">
                        {displayName}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray flex-shrink-0">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray truncate mt-0.5">
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-6 h-6 bg-red rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Show welcome screen if no conversations
  return (
    <div className="h-full flex items-center justify-center bg-cream p-8">
      <div className="text-center max-w-sm">
        {/* Bauhaus-inspired decorative element */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-cream-dark rounded-full" />
          <div className="absolute top-4 left-4 w-12 h-12 bg-red rounded-full opacity-80" />
          <div className="absolute bottom-4 right-4 w-8 h-8 bg-charcoal rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <MessageCircle className="w-10 h-10 text-gray" />
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-charcoal mb-2">
          Welcome to ChatX
        </h2>
        <p className="text-gray mb-6">
          Start a new conversation to begin messaging
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-charcoal text-cream rounded-xl font-medium hover:bg-charcoal-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
          <button
            onClick={() => setShowNewGroupModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-cream-dark text-charcoal rounded-xl font-medium hover:bg-border transition-colors"
          >
            <Users className="w-4 h-4" />
            New Group
          </button>
        </div>
      </div>
    </div>
  );
}
