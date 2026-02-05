import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ConversationItem } from './ConversationItem';
import { LogOut, Plus, Users, MessageCircle, Search } from 'lucide-react';

export function Sidebar() {
  const { user, logout } = useAuth();
  const { setShowNewChatModal, setShowNewGroupModal, setIsMobileMenuOpen } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  const conversations = useQuery(
    api.conversations.list,
    user ? { userId: user._id } as any : "skip"
  );

  // Filter conversations based on search query
  const filteredConversations = conversations?.filter((conv: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();

    // Search in group name
    if (conv.isGroup && conv.groupName?.toLowerCase().includes(query)) {
      return true;
    }

    // Search in participant names
    return conv.participants.some((p: any) =>
      p?.displayName?.toLowerCase().includes(query)
    );
  });

  const handleNewChat = () => {
    setShowNewChatModal(true);
    setIsMobileMenuOpen(false);
  };

  const handleNewGroup = () => {
    setShowNewGroupModal(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-border">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-red rounded-full" />
            <div className="w-2.5 h-2.5 bg-charcoal rounded-full" />
            <div className="w-2.5 h-2.5 bg-red rounded-full" />
            <span className="ml-2 font-bold text-xl text-charcoal">ChatX</span>
          </div>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
            style={{ backgroundColor: user?.avatarColor }}
          >
            {user?.displayName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-charcoal truncate">{user?.displayName}</p>
            <p className="text-sm text-gray truncate">@{user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray hover:text-red hover:bg-cream-dark rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 bg-cream-dark border border-border rounded-lg
                     text-sm text-charcoal placeholder:text-gray-light
                     focus:outline-none focus:border-charcoal transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-charcoal text-cream rounded-xl
                     font-medium text-sm hover:bg-charcoal-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
          <button
            onClick={handleNewGroup}
            className="flex items-center justify-center p-2.5 bg-cream-dark text-charcoal rounded-xl
                     hover:bg-border transition-colors"
            title="New Group"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {conversations === undefined ? (
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
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-cream-dark rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-gray" />
            </div>
            <p className="text-gray text-sm">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </p>
            <p className="text-gray-light text-sm mt-1">
              {searchQuery ? 'Try a different search' : 'Start a new chat!'}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {filteredConversations.map((conv: any) => (
              <ConversationItem key={conv._id} conversation={conv as any} />
            ))}
          </div>
        )}
      </div>

      {/* Footer with attribution */}
      <div className="p-3 border-t border-border text-center">
        <p className="text-xs text-gray-light">Made by @Yashas.VM</p>
      </div>
    </div>
  );
}
