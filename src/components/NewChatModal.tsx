import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { X, Search, MessageCircle } from 'lucide-react';

export function NewChatModal() {
  const { user } = useAuth();
  const { setShowNewChatModal, setActiveConversationId } = useChat();
  const [search, setSearch] = useState('');

  const allUsers = useQuery(api.users.getAll);
  const createConversation = useMutation(api.conversations.create);

  const filteredUsers = allUsers?.filter(
    (u) =>
      u._id !== user?._id &&
      (u.displayName.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()))
  );

  const handleStartChat = async (userId: string) => {
    if (!user || !userId) return;

    try {
      const conversationId = await createConversation({
        participants: [user._id, userId],
        isGroup: false,
        creatorId: user._id,
      } as any);

      setActiveConversationId(conversationId);
      setShowNewChatModal(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/50"
        onClick={() => setShowNewChatModal(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-xl font-semibold text-charcoal">New Chat</h2>
          <button
            onClick={() => setShowNewChatModal(false)}
            className="p-2 hover:bg-cream-dark rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-12 pr-4 py-3 bg-cream-dark border border-border rounded-xl
                       text-charcoal placeholder:text-gray-light
                       focus:outline-none focus:border-charcoal transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* User list */}
        <div className="max-h-80 overflow-y-auto">
          {filteredUsers === undefined ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-12 h-12 bg-cream-dark rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-cream-dark rounded w-1/2 animate-pulse" />
                    <div className="h-3 bg-cream-dark rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-cream-dark rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray" />
              </div>
              <p className="text-gray">No users found</p>
            </div>
          ) : (
            <div className="pb-4">
              {filteredUsers.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleStartChat(u._id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cream-dark transition-colors"
                >
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: u.avatarColor }}
                    >
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    {u.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-charcoal">{u.displayName}</p>
                    <p className="text-sm text-gray">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
