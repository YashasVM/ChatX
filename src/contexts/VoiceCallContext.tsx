import { createContext, useContext, useState, type ReactNode } from "react";
import type { Id } from "../../convex/_generated/dataModel";

interface CallState {
  callId: Id<"activeCalls">;
  conversationId: Id<"conversations">;
  isInitiator: boolean;
  callType: "1-on-1" | "group";
}

interface IncomingCallState {
  callId: Id<"activeCalls">;
  conversationId: Id<"conversations">;
  callType: "1-on-1" | "group";
  initiatorName: string;
  initiatorAvatarColor: string;
}

interface VoiceCallContextType {
  currentCall: CallState | null;
  setCurrentCall: (call: CallState | null) => void;
  incomingCall: IncomingCallState | null;
  setIncomingCall: (call: IncomingCallState | null) => void;
  isInCall: boolean;
}

const VoiceCallContext = createContext<VoiceCallContextType | null>(null);

export function VoiceCallProvider({ children }: { children: ReactNode }) {
  const [currentCall, setCurrentCall] = useState<CallState | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallState | null>(null);

  const isInCall = currentCall !== null;

  return (
    <VoiceCallContext.Provider
      value={{
        currentCall,
        setCurrentCall,
        incomingCall,
        setIncomingCall,
        isInCall,
      }}
    >
      {children}
    </VoiceCallContext.Provider>
  );
}

export function useVoiceCall() {
  const context = useContext(VoiceCallContext);
  if (!context) {
    throw new Error("useVoiceCall must be used within a VoiceCallProvider");
  }
  return context;
}
