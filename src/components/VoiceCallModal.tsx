import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useVoiceCall } from "../contexts/VoiceCallContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useWebRTC } from "../hooks/useWebRTC";
import { Phone, PhoneOff, Mic, MicOff, Users } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

type Participant = { _id: Id<"users">; displayName: string; avatarColor: string };

export function VoiceCallModal() {
  const { user } = useAuth();
  const { currentCall, setCurrentCall } = useVoiceCall();
  const [callDuration, setCallDuration] = useState(0);
  const remoteAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const activeCall = useQuery(
    api.voiceCalls.getCallById,
    currentCall?.callId ? { callId: currentCall.callId } : "skip"
  );

  const incomingSignals = useQuery(
    api.voiceCalls.getSignals,
    currentCall?.callId && user?._id
      ? { callId: currentCall.callId, userId: user._id as Id<"users"> }
      : "skip"
  );

  const sendSignalMutation = useMutation(api.voiceCalls.sendSignal);
  const deleteSignalMutation = useMutation(api.voiceCalls.deleteSignal);
  const leaveCallMutation = useMutation(api.voiceCalls.leaveCall);

  // Get other participants (excluding current user)
  const participants = (activeCall?.participants || []).filter(
    (p): p is Participant => p !== null
  );
  const otherParticipants = participants.filter((p) => p._id !== user?._id);
  const otherUserIds = otherParticipants.map((p) => p._id);

  const handleSignal = useCallback(
    (signal: { toUserId: string; signalType: string; signalData: string }) => {
      if (currentCall?.callId && user?._id) {
        sendSignalMutation({
          callId: currentCall.callId,
          fromUserId: user._id as Id<"users">,
          toUserId: signal.toUserId as Id<"users">,
          signalType: signal.signalType,
          signalData: signal.signalData,
        });
      }
    },
    [currentCall?.callId, user?._id, sendSignalMutation]
  );

  const handleSignalConsumed = useCallback(
    (signalId: Id<"callSignals">) => {
      deleteSignalMutation({ signalId });
    },
    [deleteSignalMutation]
  );

  const { cleanup, toggleMute, isMuted, isConnected, remoteStreams, error } = useWebRTC({
    callId: currentCall?.callId || null,
    userId: user?._id || null,
    otherUserIds,
    onSignal: handleSignal,
    incomingSignals: incomingSignals || [],
    onSignalConsumed: handleSignalConsumed,
    isInitiator: currentCall?.isInitiator || false,
  });

  // Set up remote audio elements
  useEffect(() => {
    remoteStreams.forEach((stream, peerId) => {
      let audioEl = remoteAudioRefs.current.get(peerId);
      if (!audioEl) {
        audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        document.body.appendChild(audioEl);
        remoteAudioRefs.current.set(peerId, audioEl);
      }
      if (audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
      }
    });

    // Cleanup removed streams
    remoteAudioRefs.current.forEach((audioEl, peerId) => {
      if (!remoteStreams.has(peerId)) {
        audioEl.remove();
        remoteAudioRefs.current.delete(peerId);
      }
    });
  }, [remoteStreams]);

  // Track call duration
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Check if call has ended
  useEffect(() => {
    if (activeCall?.status === "ended") {
      handleEndCall();
    }
  }, [activeCall?.status]);

  const handleEndCall = async () => {
    // Cleanup audio elements
    remoteAudioRefs.current.forEach((audioEl) => {
      audioEl.remove();
    });
    remoteAudioRefs.current.clear();

    if (currentCall?.callId && user?._id) {
      await leaveCallMutation({ callId: currentCall.callId, userId: user._id as Id<"users"> });
    }
    cleanup();
    setCurrentCall(null);
    setCallDuration(0);
  };

  if (!currentCall || !activeCall) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    if (error) return error;
    if (activeCall.status === "ringing") return "Ringing...";
    if (isConnected) return formatDuration(callDuration);
    return "Connecting...";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/80" />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl animate-fade-in p-8">
        {/* Status */}
        <div className="text-center mb-8">
          <div
            className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-3xl font-medium"
            style={{
              backgroundColor:
                currentCall.callType === "group"
                  ? "#6B7280"
                  : otherParticipants[0]?.avatarColor || "#6B7280",
            }}
          >
            {currentCall.callType === "group" ? (
              <Users className="w-12 h-12" />
            ) : (
              otherParticipants[0]?.displayName?.charAt(0).toUpperCase() || <Phone className="w-12 h-12" />
            )}
          </div>

          <h2 className="text-2xl font-semibold text-charcoal mb-2">
            {currentCall.callType === "group"
              ? `Group Call (${participants.length})`
              : otherParticipants[0]?.displayName || "Voice Call"}
          </h2>

          <p className={`${error ? "text-red" : "text-gray"}`}>{getStatusText()}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? "bg-red text-white" : "bg-cream-dark text-charcoal hover:bg-gray/20"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={handleEndCall}
            className="p-4 bg-red text-white rounded-full hover:bg-red/80 transition-colors"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

        {/* Group participants list */}
        {currentCall.callType === "group" && participants.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-gray mb-3">In this call:</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {participants.map((participant) => (
                <div key={participant._id} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: participant.avatarColor }}
                  >
                    {participant.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-charcoal">
                    {participant.displayName}
                    {participant._id === user?._id && " (You)"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
