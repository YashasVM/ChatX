import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useVoiceCall } from "../contexts/VoiceCallContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function CallNotificationListener() {
  const { user } = useAuth();
  const { setIncomingCall, isInCall, incomingCall, currentCall } = useVoiceCall();

  // Query for incoming calls
  const incomingCalls = useQuery(
    api.voiceCalls.getIncomingCalls,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );

  useEffect(() => {
    // Don't show new incoming calls if already in a call or already showing an incoming call
    if (isInCall || incomingCall) return;

    // Check if there's a new incoming call
    if (incomingCalls && incomingCalls.length > 0) {
      const call = incomingCalls[0];

      // Don't show if this is the current call we're in
      if (currentCall?.callId === call._id) return;

      setIncomingCall({
        callId: call._id,
        conversationId: call.conversationId,
        callType: call.callType as "1-on-1" | "group",
        initiatorName: call.initiator?.displayName || "Unknown",
        initiatorAvatarColor: call.initiator?.avatarColor || "#6B7280",
      });
    }
  }, [incomingCalls, isInCall, incomingCall, currentCall, setIncomingCall]);

  // Clear incoming call if it no longer exists (caller hung up)
  useEffect(() => {
    if (!incomingCall || !incomingCalls) return;

    const callStillExists = incomingCalls.some((c) => c._id === incomingCall.callId);
    if (!callStillExists) {
      setIncomingCall(null);
    }
  }, [incomingCalls, incomingCall, setIncomingCall]);

  return null;
}
