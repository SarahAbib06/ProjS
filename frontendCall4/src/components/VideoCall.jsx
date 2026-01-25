// src/components/VideoCall.jsx
import { useEffect, useRef, useState } from "react";
import { useAppel } from "../context/AppelContext";
import { useAuth } from "../hooks/useAuth";
import { Phone, Video, Mic, Maximize2, Minimize2 } from "lucide-react";

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
  
  const [status, setStatus] = useState(currentCall?.isInitiator ? "Appel en cours..." : "Appel entrant");
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState('initiating'); // initiating, waiting_peer, exchanging, connected, failed
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null); // 🆕 HEURE DE DÉBUT D'APPEL

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

  // Si pas d'appel en cours ou mauvais type, ne rien afficher
  if (!currentCall || callType !== 'video') {
    return null;
  }

  console.log("🎥 VideoCall Infos:", {
    isInitiator: currentCall.isInitiator,
    targetUserId: currentCall.targetUserId,
    callId: currentCall.callId,
    callState,
    callAccepted
  });

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startCallTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
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
      localVideoRef.current.load();
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current.load();
    }
    if (remoteAudioRef.current) {
      try {
        remoteAudioRef.current.srcObject = null;
        remoteAudioRef.current.load();
      } catch (e) {}
    }

    remoteStreamRef.current = new MediaStream();
    pendingIceCandidatesRef.current = [];
    isInitializedRef.current = false;
  };

  const handleEndCall = () => {
    console.log("📞 Fin appel vidéo");
    
    // 🆕 ENVOYER LE MESSAGE D'APPEL TERMINÉ AVEC LA DURÉE ET L'HEURE DE DÉBUT
    if (globalSocket?.connected) {
      globalSocket.emit("call-ended", {
        conversationId: currentCall.conversation?._id,
        callType: "video",
        duration: callDuration,
        initiatorId: currentCall?.isInitiator ? user._id : currentCall?.targetUserId,
        startTime: callStartTime // 🆕 AJOUT DE L'HEURE DE DÉBUT
      });
    }
    
    if (globalSocket?.connected && currentCall?.targetUserId) {
      globalSocket.emit("hang-up", {
        conversationId: currentCall.conversation?._id,
        toUserId: currentCall.targetUserId,
        callId: currentCall.callId
      });
    }
    cleanupResources();
    stopRingtone();
    endCall();
  };

  const toggleMute = () => {
    console.log("🔇 MUTE: toggleMute called");
    if (!localStreamRef.current) {
      console.warn("🔇 MUTE: no localStream");
      return;
    }
    const audioTracks = localStreamRef.current.getAudioTracks();
    console.log("🔇 MUTE: audioTracks count =", audioTracks.length);
    
    if (audioTracks.length > 0) {
      const currentEnabled = audioTracks[0].enabled;
      const newEnabled = !currentEnabled;
      
      console.log("🔇 MUTE: toggling from", currentEnabled, "to", newEnabled);
      
      // Update local stream tracks
      audioTracks.forEach(track => {
        track.enabled = newEnabled;
        console.log("🔇 MUTE: local track.enabled set to", newEnabled, "id=", track.id);
      });
      
      // Also update PC senders
      if (pcRef.current) {
        pcRef.current.getSenders().forEach(sender => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = newEnabled;
            console.log("🔇 MUTE: sender.track.enabled set to", newEnabled, "id=", sender.track.id);
          }
        });
      }
      
      setIsMuted(!newEnabled);
      console.log("🔇 MUTE: state updated, isMuted =", !newEnabled);
    }
  };

  const toggleCamera = () => {
    console.log("📹 CAMERA: toggleCamera called");
    if (!localStreamRef.current) {
      console.warn("📹 CAMERA: no localStream");
      return;
    }
    const videoTracks = localStreamRef.current.getVideoTracks();
    console.log("📹 CAMERA: videoTracks count =", videoTracks.length);
    
    if (videoTracks.length > 0) {
      const currentEnabled = videoTracks[0].enabled;
      const newEnabled = !currentEnabled;
      
      console.log("📹 CAMERA: toggling from", currentEnabled, "to", newEnabled);
      
      // Update local stream tracks
      videoTracks.forEach(track => {
        track.enabled = newEnabled;
        console.log("📹 CAMERA: local track.enabled set to", newEnabled, "id=", track.id);
      });
      
      // Also update PC senders
      if (pcRef.current) {
        pcRef.current.getSenders().forEach(sender => {
          if (sender.track && sender.track.kind === 'video') {
            sender.track.enabled = newEnabled;
            console.log("📹 CAMERA: sender.track.enabled set to", newEnabled, "id=", sender.track.id);
          }
        });
      }
      
      setCameraOff(!newEnabled);
      console.log("📹 CAMERA: state updated, cameraOff =", !newEnabled);
    }
  };

  // 🆕 ENREGISTRER L'HEURE DE DÉBUT QUAND L'APPEL COMMENCE
  useEffect(() => {
    if (currentCall && !callStartTime && (isPeerConnected || callState === 'connected')) {
      setCallStartTime(new Date());
      console.log("⏱️ Heure de début d'appel enregistrée:", new Date().toISOString());
    }
  }, [currentCall, isPeerConnected, callState]);

  const createPeerConnection = () => {
    try {
      console.log("🔗 Création PeerConnection vidéo...");
      
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" }
        ],
        iceCandidatePoolSize: 10
      });
      
      pcRef.current = pc;

      // Ajouter les tracks locaux
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
          console.log("✅ Track local ajouté:", track.kind);
        });
      }

      // Écouter les tracks distantes
      pc.ontrack = (event) => {
        try {
          console.log("🎬 TRACK DISTANT REÇU:", event.track.kind, "id=", event.track.id, "readyState=", event.track.readyState);

          // Get the incoming stream (should always be provided)
          const incomingStream = event.streams?.[0];
          
          if (incomingStream) {
            remoteStreamRef.current = incomingStream;
            console.log('🎬 STREAM: assigned remote stream id =', incomingStream.id, 'total tracks =', incomingStream.getTracks().length);
          } else {
            // Fallback if no stream in event
            console.log('🎬 FALLBACK: no stream in event, creating new MediaStream');
            if (!remoteStreamRef.current) {
              remoteStreamRef.current = new MediaStream();
            }
            remoteStreamRef.current.addTrack(event.track);
            console.log('🎬 FALLBACK: track added, now have', remoteStreamRef.current.getTracks().length, 'tracks');
          }

          // Get all video tracks
          const videoTracks = remoteStreamRef.current.getVideoTracks();
          console.log('🎬 VIDEO-TRACKS: found', videoTracks.length, 'video track(s)');
          if (videoTracks.length > 0) {
            videoTracks.forEach((vt, i) => {
              console.log(`  Track ${i}: id=${vt.id}, readyState=${vt.readyState}, enabled=${vt.enabled}`);
            });
          }

          // Attach video stream to <video> element
          if (remoteVideoRef.current) {
            console.log('🎬 VIDEO-ATTACH: starting attachment...');
            remoteVideoRef.current.muted = true; // Allow autoplay
            
            // Before assignment, log element state
            console.log('🎬 VIDEO-ATTACH: before srcObject assignment, ref exists:', !!remoteVideoRef.current);
            
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            console.log('🎬 VIDEO-ATTACH: srcObject assigned, stream has', remoteStreamRef.current.getTracks().length, 'tracks');

            // Set up event listeners
            remoteVideoRef.current.onloadedmetadata = () => {
              const w = remoteVideoRef.current?.videoWidth || 0;
              const h = remoteVideoRef.current?.videoHeight || 0;
              console.log('🎬 VIDEO-EVENT: onloadedmetadata fired - dimensions:', w, 'x', h);
              if (remoteVideoRef.current && w > 0 && h > 0) {
                remoteVideoRef.current.play().then(() => {
                  console.log('🎬 VIDEO-EVENT: play() successful, should see video now');
                }).catch(err => {
                  console.warn('🎬 VIDEO-EVENT: play() failed -', err?.message);
                  // Try again after a delay
                  setTimeout(() => {
                    if (remoteVideoRef.current) {
                      remoteVideoRef.current.play().catch(() => {});
                    }
                  }, 500);
                });
              } else {
                console.warn('🎬 VIDEO-EVENT: onloadedmetadata but dimensions are zero, waiting for frames...');
              }
            };

            remoteVideoRef.current.onplaying = () => {
              console.log('🎬 VIDEO-EVENT: onplaying fired - video is playing!');
            };

            remoteVideoRef.current.oncanplay = () => {
              const w = remoteVideoRef.current?.videoWidth || 0;
              const h = remoteVideoRef.current?.videoHeight || 0;
              console.log('🎬 VIDEO-EVENT: oncanplay fired - dimensions:', w, 'x', h);
            };

            remoteVideoRef.current.onerror = (e) => {
              console.error('🎬 VIDEO-EVENT: onerror fired -', e);
            };

            // Also set playback properties
            remoteVideoRef.current.autoplay = true;
            remoteVideoRef.current.playsInline = true;

            // Check if already has metadata (in case onloadedmetadata already fired)
            if (remoteVideoRef.current.readyState >= 1) {
              console.log('🎬 VIDEO-ATTACH: metadata already loaded, readyState=', remoteVideoRef.current.readyState);
              remoteVideoRef.current.play().catch(err => {
                console.warn('🎬 VIDEO-ATTACH: immediate play() failed -', err?.message);
              });
            }
          } else {
            console.error('🎬 VIDEO-ATTACH: remoteVideoRef.current is null or undefined!');
          }

          // Attach audio to hidden <audio> element
          if (remoteAudioRef.current && remoteStreamRef.current) {
            const audioTracks = remoteStreamRef.current.getAudioTracks();
            console.log('🎬 AUDIO-ATTACH: found', audioTracks.length, 'audio track(s)');
            if (audioTracks.length > 0) {
              const audioStream = new MediaStream(audioTracks);
              remoteAudioRef.current.srcObject = audioStream;
              remoteAudioRef.current.autoplay = true;
              remoteAudioRef.current.play().then(() => {
                console.log('🎬 AUDIO-ATTACH: play() successful');
              }).catch(err => {
                console.warn('🎬 AUDIO-ATTACH: play() failed -', err?.message);
              });
            }
          } else {
            console.warn('🎬 AUDIO-ATTACH: no audio ref or stream');
          }

          // Mark connection as active
          if (!isPeerConnected) {
            console.log('🎬 CONNECTION: marking peer as connected');
            setIsPeerConnected(true);
            setCallState('connected');
            setStatus(`✅ Connecté avec ${currentCall.targetUsername}`);
            startCallTimer();
          }

          console.log('🎬 TRACK-COMPLETE: total remote tracks now =', remoteStreamRef.current.getTracks().length);
        } catch (e) {
          console.error('🎬 ERROR in ontrack:', e?.message, e?.stack);
        }
      };

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("🧊 ICE candidate généré");
          if (globalSocket?.connected && currentCall?.targetUserId) {
            globalSocket.emit("ice-candidate", {
              conversationId: currentCall.conversation?._id,
              candidate: event.candidate,
              toUserId: currentCall.targetUserId,
              callId: currentCall.callId
            });
          }
        }
      };

      // ICE connection state
      pc.oniceconnectionstatechange = () => {
        const iceState = pc.iceConnectionState;
        console.log("🔗 ICE state:", iceState);
        
        if (iceState === "connected" || iceState === "completed") {
          setIsPeerConnected(true);
          setCallState('connected');
          if (!durationIntervalRef.current) {
            startCallTimer();
          }
          
          // Notifier l'autre pair
          if (globalSocket?.connected) {
            globalSocket.emit('call-established', {
              conversationId: currentCall.conversation?._id,
              toUserId: currentCall.targetUserId,
              callId: currentCall.callId
            });
          }
        } else if (iceState === "checking") {
          setCallState('exchanging');
          setStatus("Connexion en cours...");
        } else if (iceState === "failed") {
          setCallState('failed');
          setStatus("Échec de connexion");
          // Tentative de reconnection
          retryConnection();
        }
      };

      // ICE gathering state
      pc.onicegatheringstatechange = () => {
        console.log("🔹 ICE gathering:", pc.iceGatheringState);
      };

      console.log("✅ PeerConnection créée");

      // S'assurer que des transceivers audio/video existent pour forcer
      // NOTE: avoid adding extra transceivers here to prevent duplicate m-lines
      // If local tracks exist they were already added above via addTrack.
      return pc;

    } catch (error) {
      console.error("❌ Erreur création PeerConnection:", error);
      throw error;
    }
  };

  const retryConnection = () => {
    if (retryTimeoutRef.current) return;
    
    retryTimeoutRef.current = setTimeout(() => {
      console.log("🔄 Tentative de reconnexion...");
      if (pcRef.current && pcRef.current.connectionState === 'failed') {
        // Créer une nouvelle OFFER
        sendOffer();
      }
      retryTimeoutRef.current = null;
    }, 3000);
  };

  const sendOffer = async () => {
    if (!pcRef.current || !currentCall?.targetUserId) {
      console.error("❌ Impossible d'envoyer OFFER: PC ou targetUserId manquant");
      return;
    }

    try {
      console.log("📤 Création et envoi OFFER...");
      setCallState('exchanging');
      setStatus("Établissement de la connexion...");
      
      const offer = await pcRef.current.createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
      });
      
      await pcRef.current.setLocalDescription(offer);
      
      globalSocket.emit("offer", {
        conversationId: currentCall.conversation?._id,
        sdp: offer,
        toUserId: currentCall.targetUserId,
        callId: currentCall.callId
      });
      
      console.log("✅ OFFER envoyée");
      
    } catch (error) {
      console.error("❌ Erreur envoi OFFER:", error);
      setStatus("Erreur lors de l'appel");
    }
  };

  const processPendingIceCandidates = async () => {
    if (!pcRef.current || !pcRef.current.remoteDescription) {
      console.log("⏳ Pas de remoteDescription pour traiter les ICE candidates");
      return;
    }
    
    console.log("🔄 Traitement des ICE candidates en attente:", 
      pendingIceCandidatesRef.current.length);
    
    const processed = [];
    for (const candidate of pendingIceCandidatesRef.current) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        processed.push(candidate);
      } catch (error) {
        console.warn("⚠️ Erreur ajout ICE candidate:", error);
      }
    }
    
    // Retirer les candidats traités
    pendingIceCandidatesRef.current = pendingIceCandidatesRef.current.filter(
      c => !processed.includes(c)
    );
    
    console.log(`✅ ${processed.length} ICE candidates traités`);
  };

  // Workaround: force refresh of video element if dimensions stuck at 0
  useEffect(() => {
    if (!isPeerConnected) return;

    const checkVideoInterval = setInterval(() => {
      if (remoteVideoRef.current && remoteStreamRef.current) {
        const videoTracks = remoteStreamRef.current.getVideoTracks();
        const w = remoteVideoRef.current.videoWidth || 0;
        const h = remoteVideoRef.current.videoHeight || 0;

        if (videoTracks.length > 0 && w === 0 && h === 0) {
          console.log('🎬 WORKAROUND: video dimensions still 0, trying to refresh...');
          // Force re-assignment
          remoteVideoRef.current.srcObject = null;
          setTimeout(() => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStreamRef.current;
              remoteVideoRef.current.play().catch(() => {});
            }
          }, 100);
        } else if (w > 0 && h > 0) {
          console.log('🎬 WORKAROUND: video is rendering', w, 'x', h, '- stopping checks');
          clearInterval(checkVideoInterval);
        }
      }
    }, 2000);

    return () => clearInterval(checkVideoInterval);
  }, [isPeerConnected]);

  // Écouter les événements socket
  useEffect(() => {
    if (!globalSocket || !currentCall) return;

    const socket = globalSocket;
    console.log("🔗 Configuration des écouteurs vidéo...");

    const handleCallReady = ({ fromUserId, callId }) => {
      console.log('📞 call-ready reçu de:', fromUserId, 'callState=', callState);
      if (callId !== currentCall?.callId) {
        console.log('⚠️ callId ne correspond pas');
        return;
      }
      
      // L'autre pair est prêt, on peut envoyer l'OFFER
      if (currentCall?.isInitiator) {
        console.log('✅ Destinataire prêt, envoi OFFER...');
        sendOffer();
      }
    };

    const handleOffer = async ({ sdp, fromUserId, callId }) => {
      if (fromUserId === user?._id || callId !== currentCall.callId) {
        console.log('⚠️ OFFER ignorée (self ou mauvais callId)');
        return;
      }
      
      console.log("📨 OFFER reçue de:", fromUserId);
      setCallState('exchanging');
      
      // Attendre que le stream local soit prêt
      let waitCount = 0;
      while (!localStreamRef.current && waitCount < 50) {
        await new Promise(r => setTimeout(r, 100));
        waitCount++;
      }
      
      if (!localStreamRef.current) {
        console.log("⚠️ Stream local non prêt, création d'un stream de secours");
        try {
          localStreamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
          });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        } catch (error) {
          console.error("❌ Impossible d'obtenir le stream local:", error);
          return;
        }
      }

      if (!pcRef.current) {
        console.log("🔗 Création PeerConnection pour traiter OFFER");
        createPeerConnection();
      }

      try {
        console.log("📥 Définition remoteDescription...");
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log("✅ RemoteDescription définie");
        
        await processPendingIceCandidates();
        
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        
        console.log("📤 Envoi ANSWER à:", currentCall.targetUserId);
        
        socket.emit("answer", {
          conversationId: currentCall.conversation?._id,
          sdp: answer,
          toUserId: currentCall.targetUserId,
          callId: currentCall.callId
        });
        
        setStatus("Connexion établie...");
        
      } catch (error) {
        console.error("❌ Erreur traitement OFFER:", error);
        setStatus("Erreur de connexion");
      }
    };

    const handleAnswer = async ({ sdp, fromUserId, callId }) => {
      if (fromUserId === user?._id || callId !== currentCall.callId) {
        console.log('⚠️ ANSWER ignorée (self ou mauvais callId)');
        return;
      }
      
      console.log("📥 ANSWER reçue de:", fromUserId);
      
      if (!pcRef.current) {
        console.error("❌ PeerConnection non initialisée");
        return;
      }

      try {
          console.log("📥 Tentative setRemoteDescription depuis answer (state=", pcRef.current.signalingState, ")");

          // Only set remote description if we're in the correct state
          const sigState = pcRef.current.signalingState;
          if (sigState === 'have-local-offer' || sigState === 'have-local-pranswer') {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
            console.log("✅ RemoteDescription définie depuis answer");

            await processPendingIceCandidates();
            console.log("✅ Connexion WebRTC établie");
          } else {
            console.warn('⚠️ Ignoring ANSWER because signalingState is', sigState);
            // still try to process pending ICE in case remote also provided candidates earlier
            await processPendingIceCandidates();
          }
      } catch (error) {
        console.error("❌ Erreur traitement ANSWER:", error);
      }
    };

    const handleIceCandidate = async ({ candidate, fromUserId, callId }) => {
      if (fromUserId === user?._id || callId !== currentCall.callId) return;
      if (!candidate) return;
      
      try {
        if (pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("✅ ICE candidate ajouté immédiatement");
        } else {
          pendingIceCandidatesRef.current.push(candidate);
          console.log("⏳ ICE candidate en attente");
        }
      } catch (error) {
        console.error("❌ Erreur ajout ICE candidate:", error);
      }
    };

    const handleHangUp = ({ fromUserId }) => {
      console.log("📞 Appel raccroché par:", fromUserId);
      setStatus("Appel terminé");
      cleanupResources();
      stopRingtone();
      endCall();
    };

    const handleCallEstablished = ({ fromUserId, callId }) => {
      if (callId !== currentCall.callId) return;
      console.log('🔔 Connexion établie avec:', fromUserId);
      setIsPeerConnected(true);
      setCallState('connected');
      setStatus(`✅ Connecté avec ${currentCall.targetUsername}`);
    };

    // Configurer les écouteurs
    socket.on("call-ready", handleCallReady);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("hang-up", handleHangUp);
    socket.on("call-established", handleCallEstablished);

    // Nettoyer les écouteurs
    return () => {
      console.log("🧹 Nettoyage des écouteurs vidéo");
      socket.off("call-ready", handleCallReady);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("hang-up", handleHangUp);
      socket.off("call-established", handleCallEstablished);
    };
  }, [globalSocket, currentCall, user]);

  // Initialisation principale
  useEffect(() => {
    if (!globalSocket || !currentCall) return;

    const callKey = currentCall.conversation?._id + "-" + currentCall.isInitiator + "-" + currentCall.callId;
    
    if (isInitializedRef.current === callKey) {
      console.log("⚠️ Déjà initialisé pour cet appel");
      return;
    }

    const initCall = async () => {
      try {
        isInitializedRef.current = callKey;
        console.log("🚀 Initialisation appel vidéo...");
        
        setCallState('initiating');

        // Obtenir le stream média local
        console.log("🎥 Demande caméra et micro...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        console.log("✅ Stream local obtenu");
        // Créer la PeerConnection maintenant que le stream local est prêt
        if (!pcRef.current) {
          createPeerConnection();
        }

        // Si on est le destinataire (callee), notifier qu'on est prêt
        if (!currentCall.isInitiator) {
          console.log('📨 Callee prêt - envoi answer-call et call-ready');
          setCallState('waiting_peer');
          
          // 1. Répondre à l'appel (acceptation)
          if (globalSocket?.connected) {
            globalSocket.emit('answer-call', {
              conversationId: currentCall.conversation?._id,
              fromUserId: currentCall.targetUserId,
              callId: currentCall.callId
            });
            
            // 2. Indiquer qu'on est prêt pour WebRTC (après un court délai)
            setTimeout(() => {
              globalSocket.emit('call-ready', {
                conversationId: currentCall.conversation?._id,
                fromUserId: currentCall.targetUserId,
                callId: currentCall.callId
              });
              console.log('✅ call-ready envoyé');
            }, 800);
          }
          
          setCallAccepted(true);
        } else {
          // Si on est l'initiateur, créer la PeerConnection et attendre call-ready
          console.log('⏳ Initiateur - attente call-ready (PeerConnection déjà créée)');
          setCallState('waiting_peer');
          setStatus(`En attente de ${currentCall.targetUsername}...`);
        }

      } catch (error) {
        console.error("❌ Erreur initialisation appel vidéo:", error);
        isInitializedRef.current = false;
        setCallState('failed');
        setStatus(`Erreur: ${error.message}`);
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setStatus("Permission caméra/micro refusée");
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setStatus("Caméra ou micro non détecté");
        }
      }
    };

    initCall();

    return () => {
      console.log("🧹 Nettoyage du composant VideoCall");
      cleanupResources();
    };
  }, [currentCall, globalSocket]);

  // Si minimisé, afficher une version réduite
  if (isMinimized) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 200,
        height: 150,
        background: '#333',
        borderRadius: 10,
        overflow: 'hidden',
        zIndex: 9999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          position: 'absolute',
          top: 5,
          left: 5,
          display: 'flex',
          gap: 5,
          zIndex: 10
        }}>
          <button
            onClick={() => setIsMinimized(false)}
            style={{
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              padding: '2px 6px',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            ↗
          </button>
          <button
            onClick={handleEndCall}
            style={{
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              padding: '2px 6px',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
        
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)'
          }}
        />
        
        <div style={{
          position: 'absolute',
          bottom: 5,
          left: 5,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: 5,
          fontSize: 10
        }}>
          {formatDuration(callDuration)}
        </div>
        <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />
      </div>
    );
  }

  // Interface complète
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      color: 'white',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* En-tête - Design sobre */}
      <div style={{
        padding: '12px 20px',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(249, 238, 52, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Icône jaune */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '8px',
            background: '#F9EE34',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(249, 238, 52, 0.3)'
          }}>
            <Video size={20} color="#000" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: 15, color: '#fff' }}>
              {currentCall.targetUsername || 'Utilisateur'}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, color: '#ccc' }}>
              {status}
              {callDuration > 0 && ` • ${formatDuration(callDuration)}`}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#F9EE34',
              border: '1px solid rgba(249, 238, 52, 0.3)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(249, 238, 52, 0.15)';
              e.target.style.borderColor = 'rgba(249, 238, 52, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.borderColor = 'rgba(249, 238, 52, 0.3)';
            }}
          >
            <Minimize2 size={18} />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#F9EE34',
              border: '1px solid rgba(249, 238, 52, 0.3)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(249, 238, 52, 0.15)';
              e.target.style.borderColor = 'rgba(249, 238, 52, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.borderColor = 'rgba(249, 238, 52, 0.3)';
            }}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          
          <button
            onClick={handleEndCall}
            style={{
              background: 'rgba(200, 60, 60, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(200, 60, 60, 1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(200, 60, 60, 0.8)';
            }}
          >
            <Phone size={16} style={{ transform: 'rotate(135deg)' }} />
            Raccrocher
          </button>
        </div>
      </div>

      {/* Contenu vidéo */}
      <div style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Vidéo distante (grande) */}
        <div style={{
          flex: 1,
          background: '#000',
          position: 'relative'
        }}>
          {isPeerConnected ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 20
            }}>
              <div style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40
              }}>
                {currentCall.targetUsername?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 5 }}>
                  {currentCall.targetUsername || 'Utilisateur'}
                </div>
                <div style={{ opacity: 0.7 }}>
                  {status}
                </div>
              </div>
            </div>
          )}
          
          {/* Indicateur de connexion */}
          {!isPeerConnected && callState !== 'failed' && (
            <div style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)',
              padding: '10px 20px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#4CAF50',
                animation: 'pulse 1.5s infinite'
              }}></div>
              <span>Connexion en cours...</span>
            </div>
          )}
          
          {/* Debug info */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: 5,
            fontSize: 12
          }}>
            {remoteStreamRef.current?.getTracks().length || 0} track(s) distant(s)
          </div>
        </div>

        {/* Vidéo locale (petite) */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 160,
          height: 120,
          background: '#000',
          borderRadius: 10,
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.3)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)'
            }}
          />
          
          {/* Indicateur caméra/micro */}
          <div style={{
            position: 'absolute',
            bottom: 5,
            left: 5,
            display: 'flex',
            gap: 5
          }}>
            {cameraOff && (
              <div style={{
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: 3,
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 3
              }}>
                <Video size={10} />
              </div>
            )}
            {isMuted && (
              <div style={{
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: 3,
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 3
              }}>
                <Mic size={10} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contrôles - Design sobre avec jaune */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        borderTop: '1px solid rgba(249, 238, 52, 0.2)'
      }}>
        {/* Micro */}
        <button
          onClick={toggleMute}
          style={{
            width: 52,
            height: 52,
            borderRadius: '12px',
            background: isMuted ? 'rgba(200, 60, 60, 0.9)' : 'rgba(255,255,255,0.1)',
            color: isMuted ? 'white' : '#F9EE34',
            border: isMuted ? 'none' : '1px solid rgba(249, 238, 52, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: isMuted ? '0 2px 8px rgba(200, 60, 60, 0.4)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!isMuted) {
              e.target.style.background = 'rgba(249, 238, 52, 0.15)';
              e.target.style.borderColor = 'rgba(249, 238, 52, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMuted) {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.borderColor = 'rgba(249, 238, 52, 0.3)';
            }
          }}
        >
          <Mic size={24} strokeWidth={2} />
        </button>
        
        {/* Caméra */}
        <button
          onClick={toggleCamera}
          style={{
            width: 52,
            height: 52,
            borderRadius: '12px',
            background: cameraOff ? 'rgba(200, 60, 60, 0.9)' : 'rgba(255,255,255,0.1)',
            color: cameraOff ? 'white' : '#F9EE34',
            border: cameraOff ? 'none' : '1px solid rgba(249, 238, 52, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: cameraOff ? '0 2px 8px rgba(200, 60, 60, 0.4)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!cameraOff) {
              e.target.style.background = 'rgba(249, 238, 52, 0.15)';
              e.target.style.borderColor = 'rgba(249, 238, 52, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!cameraOff) {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.borderColor = 'rgba(249, 238, 52, 0.3)';
            }
          }}
        >
          <Video size={24} strokeWidth={2} />
        </button>
        
        {/* Raccrocher */}
        <button
          onClick={handleEndCall}
          style={{
            width: 52,
            height: 52,
            borderRadius: '12px',
            background: 'rgba(200, 60, 60, 0.9)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(200, 60, 60, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(200, 60, 60, 1)';
            e.target.style.boxShadow = '0 4px 12px rgba(200, 60, 60, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(200, 60, 60, 0.9)';
            e.target.style.boxShadow = '0 2px 8px rgba(200, 60, 60, 0.4)';
          }}
        >
          <Phone size={24} style={{ transform: 'rotate(135deg)' }} strokeWidth={2} />
        </button>
      </div>

      {/* CSS pour animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />
    </div>
  );
}