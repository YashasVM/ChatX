import { MessageCircle, Plus, Users } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

export function EmptyState() {
  const { setShowNewChatModal, setShowNewGroupModal } = useChat();

  // Simple welcome screen - no duplicate of sidebar
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
          Select a conversation
        </h2>
        <p className="text-gray mb-6">
          Choose from your chats or start a new one
        </p>

        {/* Mobile-only buttons (sidebar hidden on mobile) */}
        <div className="flex gap-3 justify-center lg:hidden">
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
