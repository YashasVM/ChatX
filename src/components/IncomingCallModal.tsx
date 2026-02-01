import { useAuth } from "../contexts/AuthContext";
import { useVoiceCall } from "../contexts/VoiceCallContext";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Phone, PhoneOff, Users } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export function IncomingCallModal() {
  const { user } = useAuth();
  const { incomingCall, setIncomingCall, setCurrentCall, isInCall } = useVoiceCall();

  const joinCallMutation = useMutation(api.voiceCalls.joinCall);
  const declineCallMutation = useMutation(api.voiceCalls.declineCall);

  // Don't show if already in a call or no incoming call
  if (!incomingCall || isInCall) return null;

  const handleAccept = async () => {
    if (user?._id && incomingCall.callId) {
      await joinCallMutation({ callId: incomingCall.callId, userId: user._id as Id<"users"> });
      setCurrentCall({
        callId: incomingCall.callId,
        conversationId: incomingCall.conversationId,
        isInitiator: false,
        callType: incomingCall.callType,
      });
      setIncomingCall(null);
    }
  };

  const handleDecline = async () => {
    if (user?._id && incomingCall.callId) {
      await declineCallMutation({ callId: incomingCall.callId, userId: user._id as Id<"users"> });
      setIncomingCall(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/80" />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl animate-fade-in p-8">
        <div className="text-center mb-8">
          <div
            className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-3xl font-medium animate-pulse"
            style={{ backgroundColor: incomingCall.initiatorAvatarColor || "#6B7280" }}
          >
            {incomingCall.callType === "group" ? (
              <Users className="w-12 h-12" />
            ) : (
              incomingCall.initiatorName?.charAt(0).toUpperCase() || "?"
            )}
          </div>

          <h2 className="text-2xl font-semibold text-charcoal mb-2">
            {incomingCall.callType === "group" ? "Incoming Group Call" : incomingCall.initiatorName}
          </h2>

          <p className="text-gray">
            {incomingCall.callType === "group"
              ? `${incomingCall.initiatorName} is calling...`
              : "Incoming voice call..."}
          </p>
        </div>

        <div className="flex items-center justify-center gap-8">
          <button
            onClick={handleDecline}
            className="p-5 bg-red text-white rounded-full hover:bg-red/80 transition-colors"
            title="Decline"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          <button
            onClick={handleAccept}
            className="p-5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            title="Accept"
          >
            <Phone className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
}
