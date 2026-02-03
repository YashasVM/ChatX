import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useVoiceCall } from '../contexts/VoiceCallContext';
import { Sidebar } from './Sidebar';
import { ChatView } from './ChatView';
import { NewChatModal } from './NewChatModal';
import { NewGroupModal } from './NewGroupModal';
import { EmptyState } from './EmptyState';
import { VoiceCallModal } from './VoiceCallModal';
import { VideoCallModal } from './VideoCallModal';
import { IncomingCallModal } from './IncomingCallModal';
import { CallNotificationListener } from './CallNotificationListener';
import { Menu, X } from 'lucide-react';

export function ChatLayout() {
  const { user } = useAuth();
  const {
    activeConversationId,
    showNewChatModal,
    showNewGroupModal,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useChat();
  const { currentCall, incomingCall } = useVoiceCall();

  if (!user) return null;

  return (
    <div className="h-full flex bg-cream overflow-hidden">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-charcoal/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-80 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-4 px-4 py-3 bg-cream border-b border-border">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-cream-dark rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-charcoal" />
            ) : (
              <Menu className="w-5 h-5 text-charcoal" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red rounded-full" />
            <span className="font-semibold text-charcoal">ChatX</span>
          </div>
        </div>

        {/* Chat area */}
        {activeConversationId ? (
          <ChatView conversationId={activeConversationId} />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Modals */}
      {showNewChatModal && <NewChatModal />}
      {showNewGroupModal && <NewGroupModal />}

      {/* Voice/Video call components */}
      <CallNotificationListener />
      {currentCall && (currentCall.hasVideo ? <VideoCallModal /> : <VoiceCallModal />)}
      {incomingCall && <IncomingCallModal />}
    </div>
  );
}
