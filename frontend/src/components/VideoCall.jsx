import { useEffect, useRef, useState } from "react";
import { useAppel } from "../context/AppelContext";
import { useAuth } from "../hooks/useAuth";
import { Phone, Video, Mic, Volume2, Users, MicOff, VideoOff, Maximize2, Minimize2, Monitor } from "lucide-react";

export default function VideoCall() {
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false); // 🆕 Partage d'écran

  // Call States
  const [status, setStatus] = useState(currentCall?.isInitiator ? "Appel en cours..." : "Appel entrant");
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState('initiating'); // initiating, waiting_peer, exchanging, connected, failed
  const [callStartTime, setCallStartTime] = useState(null);

  // Refs
  const pcRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const remoteAudioRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const isInitializedRef = useRef(false);
  const durationIntervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const screenStreamRef = useRef(null); // 🆕 Stream du partage d'écran
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
    console.log("🔴 Nettoyage des ressources vidéo...");

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
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
    setCameraOff(false);
    setIsScreenSharing(false);
    setCallState('initiating');
    callEndedEmittedRef.current = false;
  };

  // --- Handlers ---

  const handleEndCall = () => {
    console.log("📞 Fin appel vidéo");

    // 🔧 Empêcher les émissions multiples
    if (callEndedEmittedRef.current) {
      console.log("⚠️ call-ended déjà émis, nettoyage seulement");
      cleanupResources();
      stopRingtone();
      endCall();
      return;
    }

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
        callEndedEmittedRef.current = true; // 🔧 Marquer comme émis
        globalSocket.emit("call-ended", {
          conversationId: currentCall.conversation?._id,
          callType: "video",
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

      // Update PeerConnection senders if they exist
      if (pcRef.current) {
        pcRef.current.getSenders().forEach(sender => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = newEnabled;
          }
        });
      }

      if (globalSocket?.connected && currentCall?.targetUserId) {
        globalSocket.emit("toggle-audio", {
          conversationId: currentCall.conversation?._id,
          toUserId: currentCall.targetUserId,
          isAudioOn: newEnabled
        });
      }
    }
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const newEnabled = !videoTracks[0].enabled;
      videoTracks.forEach(track => { track.enabled = newEnabled; });
      setCameraOff(!newEnabled);

      if (pcRef.current) {
        pcRef.current.getSenders().forEach(sender => {
          if (sender.track && sender.track.kind === 'video') {
            sender.track.enabled = newEnabled;
          }
        });
      }

      if (globalSocket?.connected && currentCall?.targetUserId) {
        globalSocket.emit("toggle-video", {
          conversationId: currentCall.conversation?._id,
          toUserId: currentCall.targetUserId,
          isVideoOn: newEnabled
        });
      }
    }
  };

  // 🆕 Partage d'écran
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false
      });

      screenStreamRef.current = screenStream;

      // Remplacer le track vidéo dans la PeerConnection
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      // Afficher dans le local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);

      // Notifier l'autre participant
      if (globalSocket?.connected && currentCall?.targetUserId) {
        globalSocket.emit("start-screen-share", {
          conversationId: currentCall.conversation?._id,
          toUserId: currentCall.targetUserId
        });
      }

      // Écouter l'arrêt du partage (bouton navigateur)
      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error("❌ Erreur partage écran:", error);
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Restaurer la caméra
    if (localStreamRef.current && pcRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }

    setIsScreenSharing(false);

    if (globalSocket?.connected && currentCall?.targetUserId) {
      globalSocket.emit("stop-screen-share", {
        conversationId: currentCall.conversation?._id,
        toUserId: currentCall.targetUserId
      });
    }
  };

  // --- WebRTC Logic ---

  const createPeerConnection = () => {
    try {
      console.log("🔗 Création PeerConnection vidéo...");

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
          // 📌 TODO PRODUCTION: Ajouter un serveur TURN
          // {
          //   urls: "turn:your-turn-server.com:3478",
          //   username: "username",
          //   credential: "password"
          // }
        ],
        iceCandidatePoolSize: 10 // 🆕 Optimisation: pré-générer des candidates
      });

      pcRef.current = pc;

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote tracks
      pc.ontrack = (event) => {
        console.log("🎬 TRACK DISTANT REÇU:", event.track.kind);

        // Priority to full stream
        const incomingStream = event.streams?.[0];

        if (incomingStream) {
          // Standard case
          if (remoteVideoRef.current && incomingStream.getVideoTracks().length > 0) {
            remoteVideoRef.current.srcObject = incomingStream;
            remoteStreamRef.current = incomingStream; // keep reference
          }
          if (remoteAudioRef.current && incomingStream.getAudioTracks().length > 0) {
            remoteAudioRef.current.srcObject = incomingStream;
          }
        } else {
          // Fallback for individual tracks
          remoteStreamRef.current.addTrack(event.track);
          const videoTracks = remoteStreamRef.current.getVideoTracks();
          if (videoTracks.length > 0 && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
          }
        }

        setIsPeerConnected(true);
        setCallState('connected');
        if (!callDuration) startCallTimer();
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
        const iceState = pc.iceConnectionState;
        console.log("🔗 ICE state:", iceState);
        if (iceState === "connected" || iceState === "completed") {
          setIsPeerConnected(true);
          setCallState('connected');
          if (globalSocket?.connected) {
            globalSocket.emit('call-established', {
              conversationId: currentCall.conversation?._id,
              toUserId: currentCall.targetUserId,
              callId: currentCall.callId
            });
          }
        } else if (iceState === "failed") {
          setCallState('failed');
          retryConnection();
        }
      };

      return pc;
    } catch (error) {
      console.error("❌ Erreur PeerConnection:", error);
      throw error;
    }
  };

  const retryConnection = () => {
    if (retryTimeoutRef.current) return;
    retryTimeoutRef.current = setTimeout(() => {
      if (pcRef.current && pcRef.current.connectionState === 'failed') {
        sendOffer();
      }
      retryTimeoutRef.current = null;
    }, 3000);
  };

  const sendOffer = async () => {
    if (!pcRef.current || !currentCall?.targetUserId) return;
    try {
      setCallState('exchanging');
      const offer = await pcRef.current.createOffer({ offerToReceiveAudio: 1, offerToReceiveVideo: 1 });
      await pcRef.current.setLocalDescription(offer);

      globalSocket.emit("offer", {
        conversationId: currentCall.conversation?._id,
        sdp: offer,
        toUserId: currentCall.targetUserId,
        callId: currentCall.callId
      });
    } catch (error) {
      console.error("❌ Erreur envoi OFFER:", error);
    }
  };

  const processPendingIceCandidates = async () => {
    if (!pcRef.current || !pcRef.current.remoteDescription) return;
    for (const candidate of pendingIceCandidatesRef.current) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("ICE error", e);
      }
    }
    pendingIceCandidatesRef.current = [];
  };

  // --- Effects ---

  // Start Call Time Log
  useEffect(() => {
    if (currentCall && !callStartTime && (isPeerConnected || callState === 'connected')) {
      setCallStartTime(new Date());
    }
  }, [currentCall, isPeerConnected, callState]);

  // Socket Events
  useEffect(() => {
    if (!globalSocket || !currentCall) return;
    const socket = globalSocket;

    const handleCallReady = ({ fromUserId, callId }) => {
      if (callId !== currentCall?.callId) return;
      if (currentCall?.isInitiator) sendOffer();
    };

    const handleOffer = async ({ sdp, fromUserId, callId }) => {
      if (fromUserId === user?._id || callId !== currentCall.callId) return;
      setCallState('exchanging');

      // ❌ SUPPRIMÉ: Boucle d'attente synchrone (anti-pattern WebRTC)
      // Les streams doivent être déjà disponibles avant de créer la PeerConnection

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
      } catch (e) { console.error(e); }
    };

    const handleAnswer = async ({ sdp, fromUserId, callId }) => {
      if (fromUserId === user?._id || callId !== currentCall.callId) return;
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        await processPendingIceCandidates();
      } catch (e) { console.error(e); }
    };

    const handleIceCandidate = async ({ candidate, fromUserId, callId }) => {
      if (fromUserId === user?._id || callId !== currentCall.callId || !candidate) return;
      try {
        if (pcRef.current?.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingIceCandidatesRef.current.push(candidate);
        }
      } catch (e) { console.error(e); }
    };

    const handleHangUp = () => {
      setStatus("Appel terminé");
      handleEndCall();
    };

    socket.on("call-ready", handleCallReady);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("hang-up", handleHangUp);

    return () => {
      socket.off("call-ready", handleCallReady);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("hang-up", handleHangUp);
    };
  }, [globalSocket, currentCall, user]);

  // Main Initialization
  useEffect(() => {
    if (!globalSocket || !currentCall) return;
    const callKey = currentCall.conversation?._id + "-" + currentCall.isInitiator + "-" + currentCall.callId;
    if (isInitializedRef.current === callKey) return;

    const initCall = async () => {
      isInitializedRef.current = callKey;
      try {
        setCallState('initiating');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 24, max: 30 }
          }, // 🆕 Optimisé pour réduire la latence
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        createPeerConnection();

        if (!currentCall.isInitiator) {
          setCallState('waiting_peer');
          if (globalSocket?.connected) {
            globalSocket.emit('answer-call', {
              conversationId: currentCall.conversation?._id,
              fromUserId: currentCall.targetUserId,
              callId: currentCall.callId
            });
            // ❌ SUPPRIMÉ: setTimeout de 800ms (latence arbitraire)
            // Émission immédiate pour réduire la latence
            globalSocket.emit('call-ready', {
              conversationId: currentCall.conversation?._id,
              fromUserId: currentCall.targetUserId,
              callId: currentCall.callId
            });
          }
          setCallAccepted(true);
        } else {
          setCallState('waiting_peer');
          setStatus(`Appel de ${currentCall.targetUsername}...`);
        }
      } catch (error) {
        console.error("Init Error", error);
        setStatus("Erreur d'accès média");
      }
    };

    initCall();
    return () => cleanupResources();
  }, [currentCall, user]);

  if (!currentCall || callType !== 'video') return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div
        className={`
          relative shadow-xl overflow-hidden bg-[#d9b899] 
          transition-all duration-300 ease-in-out
          ${isFullscreen
            ? "fixed inset-0 w-screen h-screen rounded-none z-[9999]"
            : "w-[92%] md:w-[72%] h-[87%] rounded-xl"
          }
          ${isMinimized
            ? "fixed bottom-6 right-6 w-48 h-32 rounded-xl z-[9999] border-2 border-white"
            : ""
          }
        `}
      >
        {/* Audio Element Hidden */}
        <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />

        {/* RESTORE BUTTON when minimized */}
        {isMinimized && (
          <button
            onClick={() => setIsMinimized(false)}
            className="absolute top-1 left-1 bg-black/60 text-white px-2 py-1 rounded-md text-xs z-[10000]"
          >
            ↖
          </button>
        )}

        {/* TOP RIGHT ICONS */}
        {!isMinimized && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3
            bg-black/40 backdrop-blur-sm px-3 py-2 rounded-xl"
          >
            {/* MINIMIZE */}
            {/*<button
              onClick={() => {
                setIsMinimized(true);
                setIsFullscreen(false);
              }}
              className="hover:scale-110 transition-transform"
            >
              <Minimize2 size={20} color="white" />
            </button>*/}

            {/* FULLSCREEN */}
            <button
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                setIsMinimized(false);
              }}
              className="hover:scale-110 transition-transform"
            >
              <Maximize2 size={20} color="white" />
            </button>
          </div>
        )}

        {/* MAIN VIDEO (REMOTE) */}
        {!isMinimized ? (
          <div className="w-full h-full bg-black relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isPeerConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white z-10 flex-col gap-4">
                <img
                  src={safeChat.avatar}
                  className="w-24 h-24 rounded-full animate-pulse"
                  alt={safeChat.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(safeChat.name)}&background=F9EE34&color=000&bold=true&size=128`;
                  }}
                />
                <p className="text-xl font-medium">{status}</p>
              </div>
            )}
          </div>
        ) : (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {/* SELF VIDEO (LOCAL) - Only shown if not minimized */}
        {!isMinimized && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 
            w-32 h-44 bg-black rounded-xl shadow-md overflow-hidden border-2 border-white/20 z-20"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform scale-x-[-1] ${cameraOff ? 'hidden' : ''}`}
            />
            {cameraOff && (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white/50">
                <VideoOff size={24} />
              </div>
            )}
          </div>
        )}

        {/* INFO BAR */}
        {!isMinimized && (
          <div className="
            absolute left-1/2 -translate-x-1/2 top-4
            px-6 py-2 bg-black/30 text-white bg-white/10 backdrop-blur-md 
            rounded-xl border border-white/20 flex items-center gap-8 text-sm z-30 shadow-lg
          ">
            <div className="flex items-center gap-3">
              <img
                src={safeChat.avatar}
                className="w-8 h-8 rounded-full border border-white"
                alt={safeChat.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(safeChat.name)}&background=F9EE34&color=000&bold=true&size=128`;
                }}
              />
              <span className="font-semibold text-white tracking-wide">{safeChat.name}</span>
            </div>

            <div className="flex items-center gap-2 text-red-500 font-bold bg-white/90 px-3 py-1 rounded-full">
              <span className="text-[10px] animate-pulse">●</span>
              <span>{formatDuration(callDuration)}</span>
            </div>
          </div>
        )}

        {/* BOTTOM CONTROLS */}
        {!isMinimized && (
          <div className="
            absolute bottom-9 left-1/2 -translate-x-1/2 
            w-[90%] sm:w-[50%] bg-black/60 backdrop-blur-xl 
            py-3 rounded-2xl shadow-2xl flex 
            items-center justify-center gap-6 px-6 border border-white/10 z-30
          ">

            {/* Micro */}
            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* Camera */}
            <button
              onClick={toggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${cameraOff ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
            >
              {cameraOff ? <VideoOff size={22} /> : <Video size={22} />}
            </button>

            {/* 🆕 Partage d'écran */}
            <button
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isScreenSharing ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-200'
                }`}
            >
              <Monitor size={22} />
            </button>

            {/* HANGUP */}
            <button
              onClick={handleEndCall}
              className="w-16 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-all active:scale-95"
            >
              <Phone size={24} color="white" className="rotate-[135deg]" />
            </button>

          </div>
        )}

      </div>
    </div>
  );
}