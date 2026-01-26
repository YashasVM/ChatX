import { createContext, useContext, useState, type ReactNode } from 'react';

interface ChatContextType {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  showNewChatModal: boolean;
  setShowNewChatModal: (show: boolean) => void;
  showNewGroupModal: boolean;
  setShowNewGroupModal: (show: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <ChatContext.Provider
      value={{
        activeConversationId,
        setActiveConversationId,
        showNewChatModal,
        setShowNewChatModal,
        showNewGroupModal,
        setShowNewGroupModal,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
