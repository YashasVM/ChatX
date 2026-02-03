import { useEffect, useRef, useCallback, useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";

const ICE_SERVERS = [
  // Primary STUN servers (free)
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  // OpenRelay free TURN servers for NAT traversal
  { urls: "stun:openrelay.metered.ca:80" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

interface SignalData {
  toUserId: string;
  signalType: "offer" | "answer" | "ice-candidate";
  signalData: string;
}

interface IncomingSignal {
  _id: Id<"callSignals">;
  fromUserId: Id<"users">;
  signalType: string;
  signalData: string;
}

interface UseWebRTCProps {
  callId: Id<"activeCalls"> | null;
  userId: Id<"users"> | string | null;
  otherUserIds: (Id<"users"> | string)[];
  onSignal: (signal: SignalData) => void;
  incomingSignals: IncomingSignal[];
  onSignalConsumed: (signalId: Id<"callSignals">) => void;
  isInitiator: boolean;
  enableVideo?: boolean;
}

interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  remoteStream: MediaStream | null;
}

const VIDEO_CONSTRAINTS = {
  width: { ideal: 1280, max: 1920 },
  height: { ideal: 720, max: 1080 },
  frameRate: { ideal: 30, max: 30 },
};

export function useWebRTC({
  callId,
  userId: _userId,
  otherUserIds,
  onSignal,
  incomingSignals,
  onSignalConsumed,
  isInitiator,
  enableVideo = false,
}: UseWebRTCProps) {
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(enableVideo);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const processedSignalsRef = useRef<Set<string>>(new Set());

  // Create a peer connection for a specific user
  const createPeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          onSignal({
            toUserId: peerId,
            signalType: "ice-candidate",
            signalData: JSON.stringify(event.candidate),
          });
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) {
          setRemoteStreams((prev) => {
            const newMap = new Map(prev);
            newMap.set(peerId, stream);
            return newMap;
          });

          const existing = peerConnectionsRef.current.get(peerId);
          if (existing) {
            existing.remoteStream = stream;
          }
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setIsConnected(true);
        } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          // Try ICE restart for failed connections
          if (pc.connectionState === "failed") {
            pc.restartIce();
          }
        }
      };

      return pc;
    },
    [onSignal]
  );

  // Get local media stream (audio and optionally video)
  const getLocalStream = useCallback(async (): Promise<MediaStream> => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: enableVideo ? VIDEO_CONSTRAINTS : false,
      });
      localStreamRef.current = stream;
      setIsVideoEnabled(enableVideo && stream.getVideoTracks().length > 0);
      return stream;
    } catch (err) {
      let errorMessage = "Failed to access media devices.";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage = enableVideo
            ? "Camera/microphone access denied. Please allow access to use video calls."
            : "Microphone access denied. Please allow microphone access to use voice calls.";
        } else if (err.name === "NotFoundError") {
          errorMessage = enableVideo
            ? "No camera or microphone found."
            : "No microphone found.";
        }
      }
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [enableVideo]);

  // Add local stream to a peer connection
  const addLocalStreamToPeer = useCallback(
    async (pc: RTCPeerConnection) => {
      const stream = await getLocalStream();
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    },
    [getLocalStream]
  );

  // Create and send an offer to a peer
  const createOffer = useCallback(
    async (peerId: string) => {
      let peerData = peerConnectionsRef.current.get(peerId);

      if (!peerData) {
        const pc = createPeerConnection(peerId);
        peerData = { peerId, connection: pc, remoteStream: null };
        peerConnectionsRef.current.set(peerId, peerData);
      }

      await addLocalStreamToPeer(peerData.connection);

      const offer = await peerData.connection.createOffer();
      await peerData.connection.setLocalDescription(offer);

      onSignal({
        toUserId: peerId,
        signalType: "offer",
        signalData: JSON.stringify(offer),
      });
    },
    [createPeerConnection, addLocalStreamToPeer, onSignal]
  );

  // Handle incoming offer
  const handleOffer = useCallback(
    async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
      let peerData = peerConnectionsRef.current.get(fromUserId);

      if (!peerData) {
        const pc = createPeerConnection(fromUserId);
        peerData = { peerId: fromUserId, connection: pc, remoteStream: null };
        peerConnectionsRef.current.set(fromUserId, peerData);
      }

      await addLocalStreamToPeer(peerData.connection);
      await peerData.connection.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peerData.connection.createAnswer();
      await peerData.connection.setLocalDescription(answer);

      onSignal({
        toUserId: fromUserId,
        signalType: "answer",
        signalData: JSON.stringify(answer),
      });
    },
    [createPeerConnection, addLocalStreamToPeer, onSignal]
  );

  // Handle incoming answer
  const handleAnswer = useCallback(async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    const peerData = peerConnectionsRef.current.get(fromUserId);
    if (peerData) {
      await peerData.connection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, []);

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    const peerData = peerConnectionsRef.current.get(fromUserId);
    if (peerData) {
      await peerData.connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  // Initialize connections to all other users (for initiator)
  const initializeConnections = useCallback(async () => {
    if (!isInitiator || otherUserIds.length === 0) return;

    for (const peerId of otherUserIds) {
      if (!peerConnectionsRef.current.has(peerId)) {
        await createOffer(peerId);
      }
    }
  }, [isInitiator, otherUserIds, createOffer]);

  // Process incoming signals
  useEffect(() => {
    if (!callId || incomingSignals.length === 0) return;

    const processSignals = async () => {
      for (const signal of incomingSignals) {
        // Skip already processed signals
        if (processedSignalsRef.current.has(signal._id)) {
          continue;
        }
        processedSignalsRef.current.add(signal._id);

        try {
          const data = JSON.parse(signal.signalData);

          switch (signal.signalType) {
            case "offer":
              await handleOffer(signal.fromUserId, data);
              break;
            case "answer":
              await handleAnswer(signal.fromUserId, data);
              break;
            case "ice-candidate":
              await handleIceCandidate(signal.fromUserId, data);
              break;
          }

          onSignalConsumed(signal._id);
        } catch (err) {
          console.error("Error processing signal:", err);
        }
      }
    };

    processSignals();
  }, [callId, incomingSignals, handleOffer, handleAnswer, handleIceCandidate, onSignalConsumed]);

  // Initialize connections when call starts
  useEffect(() => {
    if (callId && isInitiator && otherUserIds.length > 0) {
      initializeConnections();
    }
  }, [callId, isInitiator, otherUserIds, initializeConnections]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Cleanup all connections
  const cleanup = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((peerData) => {
      peerData.connection.close();
    });
    peerConnectionsRef.current.clear();

    // Reset state
    setRemoteStreams(new Map());
    setIsConnected(false);
    setIsMuted(false);
    setIsVideoEnabled(false);
    setError(null);
    processedSignalsRef.current.clear();
  }, []);

  return {
    toggleMute,
    toggleVideo,
    cleanup,
    isMuted,
    isVideoEnabled,
    isConnected,
    remoteStreams,
    error,
    localStream: localStreamRef.current,
  };
}
