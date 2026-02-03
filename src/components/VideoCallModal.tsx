import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useVoiceCall } from "../contexts/VoiceCallContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useWebRTC } from "../hooks/useWebRTC";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Users, Minimize2, Maximize2 } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

type Participant = { _id: Id<"users">; displayName: string; avatarColor: string };

export function VideoCallModal() {
  const { user } = useAuth();
  const { currentCall, setCurrentCall } = useVoiceCall();
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

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

  const { cleanup, toggleMute, toggleVideo, isMuted, isVideoEnabled, isConnected, remoteStreams, error, localStream } = useWebRTC({
    callId: currentCall?.callId || null,
    userId: user?._id || null,
    otherUserIds,
    onSignal: handleSignal,
    incomingSignals: incomingSignals || [],
    onSignalConsumed: handleSignalConsumed,
    isInitiator: currentCall?.isInitiator || false,
    enableVideo: true,
  });

  // Set up local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote video elements
  useEffect(() => {
    remoteStreams.forEach((stream, peerId) => {
      const videoEl = remoteVideoRefs.current.get(peerId);
      if (videoEl && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
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

  // Minimized floating video view
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-48 h-36 rounded-xl overflow-hidden shadow-2xl bg-charcoal animate-fade-in">
        {/* Remote video or placeholder */}
        {otherParticipants.length > 0 && remoteStreams.size > 0 ? (
          <video
            ref={(el) => {
              if (el && otherParticipants[0]) {
                remoteVideoRefs.current.set(otherParticipants[0]._id, el);
                const stream = remoteStreams.get(otherParticipants[0]._id);
                if (stream) el.srcObject = stream;
              }
            }}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray/20">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-medium"
              style={{ backgroundColor: otherParticipants[0]?.avatarColor || "#6B7280" }}
            >
              {otherParticipants[0]?.displayName?.charAt(0).toUpperCase() || "?"}
            </div>
          </div>
        )}

        {/* Expand button */}
        <button
          onClick={() => setIsMinimized(false)}
          className="absolute top-2 right-2 p-1.5 bg-charcoal/60 text-white rounded-lg hover:bg-charcoal/80 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Duration overlay */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-charcoal/60 text-white text-xs rounded">
          {getStatusText()}
        </div>
      </div>
    );
  }

  // Grid layout for multiple participants
  const getGridClass = () => {
    const count = Math.max(1, otherParticipants.length);
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2 grid-rows-2";
    return "grid-cols-3 grid-rows-2";
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-charcoal/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-semibold">
              {currentCall.callType === "group"
                ? `Group Call (${participants.length})`
                : otherParticipants[0]?.displayName || "Video Call"}
            </h2>
            <span className={`text-sm ${error ? "text-red" : "text-white/70"}`}>
              {getStatusText()}
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video grid */}
      <div className={`flex-1 grid ${getGridClass()} gap-1 p-1`}>
        {otherParticipants.length === 0 ? (
          // Waiting for others
          <div className="flex items-center justify-center bg-gray/10">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-3xl font-medium animate-pulse bg-gray/30">
                <Users className="w-12 h-12" />
              </div>
              <p className="text-white/70">Waiting for others to join...</p>
            </div>
          </div>
        ) : (
          otherParticipants.map((participant) => {
            const stream = remoteStreams.get(participant._id);
            const hasVideo = stream && stream.getVideoTracks().some(t => t.enabled);

            return (
              <div key={participant._id} className="relative bg-gray/10 flex items-center justify-center">
                {hasVideo ? (
                  <video
                    ref={(el) => {
                      if (el) {
                        remoteVideoRefs.current.set(participant._id, el);
                        if (stream) el.srcObject = stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-medium"
                    style={{ backgroundColor: participant.avatarColor }}
                  >
                    {participant.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Participant name overlay */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-charcoal/60 text-white text-sm rounded">
                  {participant.displayName}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Local video preview */}
      <div className="absolute bottom-24 right-4 w-40 h-28 rounded-xl overflow-hidden shadow-lg bg-gray/20">
        {localStream && isVideoEnabled ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
            style={{ transform: "scaleX(-1)" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium"
              style={{ backgroundColor: user ? "#6B7280" : "#374151" }}
            >
              {user?.displayName?.charAt(0).toUpperCase() || "?"}
            </div>
          </div>
        )}
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-charcoal/60 text-white text-xs rounded">
          You
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-charcoal/80 to-transparent">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? "bg-red text-white" : "bg-white/20 text-white hover:bg-white/30"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              !isVideoEnabled ? "bg-red text-white" : "bg-white/20 text-white hover:bg-white/30"
            }`}
            title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          <button
            onClick={handleEndCall}
            className="p-4 bg-red text-white rounded-full hover:bg-red/80 transition-colors"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Group participants sidebar for group calls */}
      {currentCall.callType === "group" && participants.length > 2 && (
        <div className="absolute top-16 right-4 w-48 bg-charcoal/80 rounded-xl p-3 max-h-60 overflow-y-auto">
          <p className="text-white/70 text-xs mb-2">In this call:</p>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div key={participant._id} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: participant.avatarColor }}
                >
                  {participant.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-white text-sm truncate">
                  {participant.displayName}
                  {participant._id === user?._id && " (You)"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
