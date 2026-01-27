import { Plus, Users, Search } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ConversationItem } from './ConversationItem';

export function EmptyState() {
  const { setShowNewChatModal, setShowNewGroupModal } = useChat();
  const { user } = useAuth();

  const conversations = useQuery(
    api.conversations.list,
    user ? { userId: user._id } as any : "skip"
  );

  const allUsers = useQuery(api.users.getAll);

  // Filter out current user from discover list
  const discoverUsers = allUsers?.filter((u: any) => u._id !== user?._id) || [];

  const hasConversations = conversations && conversations.length > 0;

  return (
    <div className="h-full flex flex-col bg-cream">
      {/* Header */}
      <div className="p-4 border-b border-border bg-white">
        <h2 className="text-xl font-semibold text-charcoal">
          {hasConversations ? 'Recent chats' : 'Discover'}
        </h2>
        <p className="text-sm text-gray mt-1">
          {hasConversations
            ? 'Continue your conversations'
            : 'Start chatting with people'}
        </p>
      </div>

      {/* Action buttons - always visible on mobile */}
      <div className="p-4 flex gap-2 lg:hidden">
        <button
          onClick={() => setShowNewChatModal(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-charcoal text-cream rounded-xl font-medium text-sm hover:bg-charcoal-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
        <button
          onClick={() => setShowNewGroupModal(true)}
          className="flex items-center justify-center p-2.5 bg-cream-dark text-charcoal rounded-xl hover:bg-border transition-colors"
          title="New Group"
        >
          <Users className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {conversations === undefined ? (
          // Loading state
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-12 h-12 bg-cream-dark rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-cream-dark rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-cream-dark rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : hasConversations ? (
          // Show recent conversations
          <div className="py-2">
            {conversations.map((conv: any) => (
              <ConversationItem key={conv._id} conversation={conv as any} />
            ))}
          </div>
        ) : (
          // Discover - show users to chat with
          <div className="p-4">
            {discoverUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-cream-dark rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray" />
                </div>
                <p className="text-gray">No users to discover yet</p>
                <p className="text-gray-light text-sm mt-1">Be the first to invite friends!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {discoverUsers.map((u: any) => (
                  <button
                    key={u._id}
                    onClick={() => setShowNewChatModal(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream-dark transition-colors text-left"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: u.avatarColor }}
                    >
                      {u.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-charcoal truncate">{u.displayName}</p>
                      <p className="text-sm text-gray truncate">@{u.username}</p>
                    </div>
                    {u.isOnline && (
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
