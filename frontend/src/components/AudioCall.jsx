import { useEffect, useRef, useState } from "react";
import { useAppel } from "../context/AppelContext";
import { useAuth } from "../hooks/useAuth";
import { Phone, Mic, MicOff, Maximize2, Minimize2 } from "lucide-react";

export default function AudioCall() {
  const { user } = useAuth();
  const {
    currentCall,
    endCall,
    socket: globalSocket,
    callType,
    stopRingtone,
    callAccepted,
    setCallAccepted
  } = useAppel();

  // UI States
  const [isMinimized, setIsMinimized] = useState(false);

  // Call States
  const [status, setStatus] = useState(currentCall?.isInitiator ? "Appel en cours..." : "Appel entrant");
  const [isMuted, setIsMuted] = useState(false);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);

  // Refs
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const remoteAudioRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const isInitializedRef = useRef(false);
  const durationIntervalRef = useRef(null);
  const callEndedEmittedRef = useRef(false); // 🔧 Empêcher les duplications

  // Constants
  // Helper pour générer URL d'avatar avec initiales en fallback
  const getAvatarUrl = (profilePicture, username) => {
    if (profilePicture) return profilePicture;
    const name = username || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F9EE34&color=000&bold=true&size=128`;
  };

  const safeChat = {
    name: currentCall?.targetUsername || "Utilisateur",
    avatar: getAvatarUrl(
      currentCall?.targetAvatar ||
      currentCall?.conversation?.participants?.find(
        p => p._id === currentCall.targetUserId
      )?.profilePicture,
      currentCall?.targetUsername
    )
  };

  // --- Logic Helpers ---

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startCallTimer = () => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanupResources = () => {
    console.log("🔴 Nettoyage des ressources audio...");
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    remoteStreamRef.current = new MediaStream();
    pendingIceCandidatesRef.current = [];
    isInitializedRef.current = false;

    // 🔧 Réinitialiser tous les états UI
    setCallDuration(0);
    setCallStartTime(null);
    setIsPeerConnected(false);
    setIsMuted(false);
    callEndedEmittedRef.current = false;
  };

  const handleEndCall = () => {
    console.log("📞 Fin appel audio");
    if (globalSocket?.connected) {
      // 🆕 Détecter si c'est une annulation (pas encore accepté) ou un hang-up normal
      const isCallCancellation = !callAccepted && currentCall?.isInitiator;

      if (isCallCancellation) {
        // Annuler l'appel avant qu'il soit accepté
        globalSocket.emit("cancel-call", {
          conversationId: currentCall.conversation?._id,
          toUserId: currentCall.targetUserId,
          callId: currentCall.callId
        });
        console.log("✅ Appel annulé avant acceptation");
      } else {
        // Appel normal en cours ou déjà accepté
        globalSocket.emit("call-ended", {
          conversationId: currentCall.conversation?._id,
          callType: "audio",
          duration: callDuration,
          initiatorId: currentCall?.isInitiator ? user._id : currentCall?.targetUserId,
          startTime: callStartTime
        });
        if (currentCall?.targetUserId) {
          globalSocket.emit("hang-up", {
            conversationId: currentCall.conversation?._id,
            toUserId: currentCall.targetUserId,
            callId: currentCall.callId
          });
        }
      }
    }
    cleanupResources();
    stopRingtone();
    endCall();
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const newEnabled = !audioTracks[0].enabled;
      audioTracks.forEach(track => { track.enabled = newEnabled; });
      setIsMuted(!newEnabled);
      if (globalSocket?.connected && currentCall?.targetUserId) {
        globalSocket.emit("toggle-audio", {
          conversationId: currentCall.conversation?._id,
          toUserId: currentCall.targetUserId,
          isAudioOn: newEnabled
        });
      }
    }
  };

  // --- WebRTC Logic ---

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });
    pcRef.current = pc;

    // Add local audio
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
    }

    // Handle remote audio
    pc.ontrack = (event) => {
      console.log("🎬 TRACK AUDIO REÇU:", event.track.kind);
      if (remoteAudioRef.current) {
        // Simple assignment works best usually
        if (event.streams && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
        } else {
          const stream = new MediaStream();
          stream.addTrack(event.track);
          remoteAudioRef.current.srcObject = stream;
        }
        remoteAudioRef.current.play().catch(e => console.warn("Audio play error", e));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && globalSocket?.connected && currentCall?.targetUserId) {
        globalSocket.emit("ice-candidate", {
          conversationId: currentCall.conversation?._id,
          candidate: event.candidate,
          toUserId: currentCall.targetUserId,
          callId: currentCall.callId
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setIsPeerConnected(true);
        if (!callDuration) startCallTimer();
      }
    };

    return pc;
  };

  const processPendingIceCandidates = async () => {
    if (!pcRef.current || !pcRef.current.remoteDescription) return;
    for (const candidate of pendingIceCandidatesRef.current) {
      try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) { }
    }
    pendingIceCandidatesRef.current = [];
  };

  // --- Effects ---

  useEffect(() => {
    if (currentCall && !callStartTime && (isPeerConnected || callDuration > 0)) {
      setCallStartTime(new Date());
    }
  }, [currentCall, isPeerConnected, callDuration]);

  useEffect(() => {
    if (!globalSocket || !currentCall || callType !== 'audio') return;
    const socket = globalSocket;

    const handleOffer = async ({ sdp, fromUserId, callId }) => {
      if (fromUserId === user?._id || callId !== currentCall?.callId) return;

      let wait = 0;
      while (!localStreamRef.current && wait < 50) { await new Promise(r => setTimeout(r, 100)); wait++; }

      if (!pcRef.current) createPeerConnection();

      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        await processPendingIceCandidates();
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit("answer", {
          conversationId: currentCall.conversation?._id,
          sdp: answer,
          toUserId: currentCall.targetUserId,
          callId: currentCall.callId
        });
        setStatus("Appel établi");
      } catch (e) { console.error(e); }
    };

    const handleAnswer = async ({ sdp, fromUserId, callId }) => {
      if (fromUserId === user?._id || callId !== currentCall?.callId) return;
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        await processPendingIceCandidates();
        setIsPeerConnected(true);
      } catch (e) { console.error(e); }
    };

    const handleIceCandidate = async ({ candidate, fromUserId, callId }) => {
      if (fromUserId === user?._id || callId !== currentCall?.callId) return;
      try {
        if (pcRef.current?.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingIceCandidatesRef.current.push(candidate);
        }
      } catch (e) { }
    };

    const handleHangUp = () => {
      setStatus("Appel terminé");
      handleEndCall();
    };

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("hang-up", handleHangUp);

    return () => {
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("hang-up", handleHangUp);
    };
  }, [globalSocket, currentCall, user, callType]);

  useEffect(() => {
    if (!globalSocket || !currentCall || callType !== 'audio') return;
    const callKey = currentCall.conversation?._id + "-" + currentCall.isInitiator + "-" + currentCall.callId;
    if (isInitializedRef.current === callKey) return;

    const initCall = async () => {
      isInitializedRef.current = callKey;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        localStreamRef.current = stream;

        if (!currentCall.isInitiator) {
          // Callee
          createPeerConnection();
          if (globalSocket?.connected) {
            globalSocket.emit('answer-call', {
              conversationId: currentCall.conversation?._id,
              fromUserId: currentCall.targetUserId,
              callId: currentCall.callId
            });
            setCallAccepted(true);
          }
        } else {
          // Initiator waits for acceptance (we don't get call-ready in audio strictly, but we can wait or start offer if we know they accepted)
          // Logic check: The original code waited for accept. 
          createPeerConnection();

          // We'll optimistically create offer if we just started, 
          // BUT typically we wait for 'answer-call' event which sets callAccepted in context?
          // In VideoCall we use 'call-ready'.
          // Let's implement immediate offer for now to ensure connectivity if logic differs.
          // Actually, simply creating the offer is safe.
          const offer = await pcRef.current.createOffer({ offerToReceiveAudio: 1 });
          await pcRef.current.setLocalDescription(offer);
          globalSocket.emit("offer", {
            conversationId: currentCall.conversation?._id,
            sdp: offer,
            toUserId: currentCall.targetUserId,
            callId: currentCall.callId
          });
          setStatus(`Appel vers ${currentCall.targetUsername}...`);
        }
      } catch (e) {
        console.error("Audio Init Error", e);
        setStatus("Erreur micro");
      }
    };

    initCall();
    return () => cleanupResources();
  }, [currentCall, user, callType]);

  if (!currentCall || callType !== 'audio') return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Background */}
      <div
        className={`
             relative shadow-xl overflow-hidden bg-gradient-to-br from-yellow-400 to-yellow-600 
             transition-all duration-300 ease-in-out flex flex-col items-center justify-center
             ${isMinimized
            ? "fixed bottom-6 right-6 w-48 h-32 rounded-xl z-[9999] border-2 border-white"
            : "w-[92%] md:w-[72%] h-[87%] rounded-xl"
          }
          `}
      >
        <audio ref={remoteAudioRef} autoPlay />

        {/* Minimize / Maximize */}
        {!isMinimized && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-xl">
            <button onClick={() => setIsMinimized(true)} className="hover:scale-110 transition-transform">
              <Minimize2 size={20} color="white" />
            </button>
          </div>
        )}
        {isMinimized && (
          <button onClick={() => setIsMinimized(false)} className="absolute top-1 left-1 bg-black/60 text-white px-2 py-1 rounded-md text-xs z-[10000]">
            ↖
          </button>
        )}

        {/* Content */}
        <div className="flex flex-col items-center gap-6 z-10">
          {/* Avatar with Ring */}
          <div className="relative">
            <div className={`absolute inset-0 rounded-full border-4 border-white/30 ${isPeerConnected && !isMinimized ? 'animate-ping' : ''}`}></div>
            <img
              src={safeChat.avatar}
              className={`${isMinimized ? 'w-16 h-16' : 'w-32 h-32'} rounded-full border-4 border-white shadow-xl object-cover transition-all`}
              alt={safeChat.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(safeChat.name)}&background=F9EE34&color=000&bold=true&size=128`;
              }}
            />
          </div>

          {!isMinimized && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2 shadow-sm">{safeChat.name}</h2>
              <p className="text-white/80 font-medium">{status}</p>
              {/* 🆕 Timer affiché dès que callDuration > 0 */}
              {callDuration > 0 && (
                <p className="text-xl text-black font-bold mt-2 font-mono bg-white/90 px-4 py-1 rounded-full inline-block">
                  {formatDuration(callDuration)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        {!isMinimized && (
          <div className="absolute bottom-12 flex items-center gap-6">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${isMuted ? 'bg-red-500 text-white' : 'bg-white text-black'}`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <button
              onClick={handleEndCall}
              className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl hover:bg-red-700 transition-transform hover:scale-105 active:scale-95"
            >
              <Phone size={32} color="white" className="rotate-[135deg]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

//Ce commentaire ne sert à rienditou mais outqassaset ara