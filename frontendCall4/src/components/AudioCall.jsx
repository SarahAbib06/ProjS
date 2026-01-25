// src/components/AudioCall.jsx
import { useEffect, useRef, useState } from "react";
import { useAppel } from "../context/AppelContext";
import { useAuth } from "../hooks/useAuth";

export default function AudioCall() {
  const { user } = useAuth();
  const { currentCall, endCall, socket: globalSocket, setCurrentCall, stopRingtone, callType, callAccepted, setCallAccepted } = useAppel();
  
  const [status, setStatus] = useState(currentCall?.isInitiator ? "Appel en cours..." : "Appel accepté");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null); // 🆕 HEURE DE DÉBUT D'APPEL

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const durationIntervalRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const isInitializedRef = useRef(false);
  const remoteAudioRef = useRef(null);

  // Si pas d'appel en cours ou mauvais type, ne rien afficher
  if (!currentCall || callType !== 'audio') {
    console.log("⛔ AudioCall ne s'affiche pas:", { currentCallExists: !!currentCall, callType, expectedType: 'audio' });
    return null;
  }

  // DEBUG: Log des infos de l'appel
  console.log("📱 AudioCall Infos:", {
    isInitiator: currentCall.isInitiator,
    targetUserId: currentCall.targetUserId,
    conversationId: currentCall.conversation?._id
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
    console.log("🔴 Nettoyage des ressources audio...");
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    pendingIceCandidatesRef.current = [];
    isInitializedRef.current = false;
  };

  const handleEndCall = () => {
    console.log("📞 Raccrochage de l'appel vocal...");
    
    // 🆕 ENVOYER LE MESSAGE D'APPEL TERMINÉ AVEC LA DURÉE ET L'HEURE DE DÉBUT
    if (globalSocket?.connected) {
      globalSocket.emit("call-ended", {
        conversationId: currentCall.conversation?._id,
        callType: "audio",
        duration: callDuration,
        initiatorId: currentCall?.isInitiator ? user._id : currentCall?.targetUserId,
        startTime: callStartTime // 🆕 AJOUT DE L'HEURE DE DÉBUT
      });
    }
    
    if (globalSocket?.connected) {
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

  // 🆕 ENREGISTRER L'HEURE DE DÉBUT QUAND L'APPEL COMMENCE
  useEffect(() => {
    if (currentCall && !callStartTime && (isPeerConnected || callDuration > 0)) {
      setCallStartTime(new Date());
      console.log("⏱️ Heure de début d'appel audio enregistrée:", new Date().toISOString());
    }
  }, [currentCall, isPeerConnected, callDuration]);

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const newMuteState = !audioTracks[0].enabled;
      audioTracks.forEach(track => {
        track.enabled = newMuteState;
      });
      setIsMuted(!newMuteState);
      
      if (globalSocket?.connected && currentCall?.targetUserId) {
        globalSocket.emit("toggle-audio", {
          conversationId: currentCall.conversation?._id,
          toUserId: currentCall.targetUserId,
          isAudioOn: newMuteState
        });
      }
    }
  };

  const createPeerConnection = () => {
    try {
      console.log("🔗 Création de PeerConnection audio...");
      console.log("🔍 targetUserId:", currentCall?.targetUserId);
      
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" }
        ]
      });
      
      pcRef.current = pc;

      // Écouter les tracks distantes
      pc.ontrack = (event) => {
        console.log("🎬 Track audio distant reçue id:", event.track.id);

        const localIds = localStreamRef.current ? localStreamRef.current.getTracks().map(t => t.id) : [];
        const externalStream = new MediaStream();
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach(track => {
            const isLocal = localIds.includes(track.id);
            console.log('➕ Candidate audio track:', track.id, 'isLocal:', isLocal);
            if (!isLocal) {
              externalStream.addTrack(track);
              console.log('✅ Ajout track audio distante externe:', track.id);
            } else {
              console.log('⚠️ Ignorée (track locale détectée) :', track.id);
            }
          });
        }

        if (externalStream.getTracks().length === 0) {
          console.log('⚠️ Aucun track audio externe détecté — possible loopback, on ignore');
          return;
        }

        remoteStreamRef.current.getTracks().forEach(t => remoteStreamRef.current.removeTrack(t));
        externalStream.getTracks().forEach(t => remoteStreamRef.current.addTrack(t));
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStreamRef.current;
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.play().catch(e => console.warn('Impossible de play() l\'audio distante:', e && e.message));
        }
      };

      // Ajouter les tracks locales
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Gestion ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("❄️ ICE candidate généré");
          if (!currentCall?.targetUserId) {
            console.error("❌ targetUserId est undefined - ICE non envoyé!");
            return;
          }
          globalSocket?.emit("ice-candidate", {
            conversationId: currentCall.conversation?._id,
            candidate: event.candidate,
            toUserId: currentCall.targetUserId,
            callId: currentCall.callId
          });
        }
      };

      // Suivi de l'état ICE
      pc.oniceconnectionstatechange = () => {
        console.log("🔗 État ICE:", pc.iceConnectionState);
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          setIsPeerConnected(true);
          startCallTimer();
        } else if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
          setIsPeerConnected(false);
        }
      };

      console.log("✅ PeerConnection audio créée avec succès");
      return pc;

    } catch (error) {
      console.error("❌ Erreur création PeerConnection:", error);
      throw error;
    }
  };

  const processPendingIceCandidates = async () => {
    if (!pcRef.current || !pcRef.current.remoteDescription) {
      console.log("⏳ Pas de remoteDescription pour traiter les ICE candidates");
      return;
    }
    
    console.log("🔄 Traitement de", pendingIceCandidatesRef.current.length, "ICE candidates en attente");
    
    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift();
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("✅ ICE candidate traité (en attente)");
      } catch (error) {
        console.error("❌ Erreur ajout ICE candidate:", error);
      }
    }
  };

  // Écouter les événements socket
  useEffect(() => {
    if (!globalSocket || !currentCall || callType !== 'audio') {
      console.log("⏳ Listeners audio: En attente du socket global et de l'appel audio...", { 
        hasSocket: !!globalSocket, 
        hasCall: !!currentCall,
        callType 
      });
      return;
    }

    const socket = globalSocket;
    console.log("🔗 Configuration des écouteurs socket audio...");

    const handleOffer = async ({ sdp, fromUserId, callId }) => {
      // Ignore les signaux provenant de soi-même (prévenir boucle locale)
      if (fromUserId === user?._id) {
        console.log('⚠️ Ignoring OFFER from self', fromUserId);
        return;
      }
      console.log("📨 OFFER reçue de:", fromUserId, "callId:", callId);
      if (callId && currentCall.callId && callId !== currentCall.callId) {
        console.log('⚠️ OFFER pour un autre callId, ignore');
        return;
      }
      
      // Attendre que la PeerConnection soit créée par initCall
      let retries = 0;
      while (!pcRef.current && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!pcRef.current) {
        console.error("❌ PeerConnection non créée après attente");
        return;
      }

      try {
        console.log("📥 Définition de remoteDescription...");
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log("✅ RemoteDescription définie");
        
        await processPendingIceCandidates();
        
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        
        console.log("📤 Envoi de ANSWER à:", currentCall.targetUserId);
        
        socket.emit("answer", {
          conversationId: currentCall.conversation?._id,
          sdp: answer,
          toUserId: currentCall.targetUserId,
          callId: currentCall.callId
        });
        
        setStatus("Appel établi");
        
      } catch (error) {
        console.error("❌ Erreur traitement OFFER:", error);
        setStatus("Erreur de connexion");
      }
    };

    const handleAnswer = async ({ sdp, fromUserId, callId }) => {
      // Ignore les signaux provenant de soi-même (prévenir boucle locale)
      if (fromUserId === user?._id) {
        console.log('⚠️ Ignoring ANSWER from self', fromUserId);
        return;
      }
      console.log("📥 ANSWER reçue de:", fromUserId, "callId:", callId);
      if (callId && currentCall.callId && callId !== currentCall.callId) {
        console.log('⚠️ ANSWER pour un autre callId, ignore');
        return;
      }
      
      if (!pcRef.current) {
        console.error("❌ PeerConnection non initialisée");
        return;
      }

      try {
        if (pcRef.current.signalingState === "have-local-offer") {
          console.log("📥 Définition de remoteDescription depuis answer...");
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          console.log("✅ RemoteDescription définie depuis answer");
          
          await processPendingIceCandidates();
          
          console.log("✅ Connexion WebRTC audio établie");
        }
      } catch (error) {
        console.error("❌ Erreur traitement ANSWER:", error);
      }
    };

    const handleIceCandidate = async ({ candidate, fromUserId, callId }) => {
      // Ignore les signaux provenant de soi-même
      if (fromUserId === user?._id) {
        console.log('⚠️ Ignoring ICE candidate from self', fromUserId);
        return;
      }
      if (callId && currentCall.callId && callId !== currentCall.callId) {
        console.log('⚠️ ICE candidate pour un autre callId, ignore');
        return;
      }
      if (!candidate) return;
      
      try {
        if (pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("✅ ICE candidate ajouté immédiatement");
        } else {
          pendingIceCandidatesRef.current.push(candidate);
          console.log("⏳ ICE candidate en attente (pas de remoteDescription)");
        }
      } catch (error) {
        console.error("❌ Erreur ajout ICE candidate:", error);
      }
    };

    const handleHangUp = ({ fromUserId }) => {
      console.log("📞 Appel vocal raccroché par:", fromUserId);
      setStatus("Appel terminé par l'autre participant");
      cleanupResources();
      stopRingtone();
      endCall();
    };

    // Configurer les écouteurs
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("hang-up", handleHangUp);

    // Nettoyer les écouteurs
    return () => {
      console.log("🧹 Nettoyage des écouteurs socket audio");
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("hang-up", handleHangUp);
    };
  }, [currentCall, endCall, user, globalSocket, callType, stopRingtone]);

  // Initialisation principale
  useEffect(() => {
    if (!globalSocket || !currentCall || callType !== 'audio') {
      console.log("⚠️ Initialisation bloquée:", { hasSocket: !!globalSocket, hasCall: !!currentCall, callType });
      return;
    }

    // Utiliser conversationId comme clé unique
    const callKey = currentCall.conversation?._id + "-" + currentCall.isInitiator;
    
    if (isInitializedRef.current === callKey) {
      console.log("⚠️ Déjà initialisé pour cet appel...");
      return;
    }

    const initCall = async () => {
      try {
        isInitializedRef.current = callKey;
        console.log("🚀 Initialisation de l'appel vocal...");

        // Vérifier que le socket est connecté
        if (!globalSocket.connected) {
          console.log("⏳ En attente de connexion socket...");
          await new Promise((resolve) => {
            globalSocket.once("connect", resolve);
          });
        }

        // Obtenir le stream média local (audio seulement)
        console.log("🎤 Demande du micro...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        localStreamRef.current = stream;
        console.log("✅ Stream audio obtenu");

        // Créer la PeerConnection
        // Si on est l'initiateur, attendre l'acceptation distante avant de créer l'OFFER
        if (currentCall.isInitiator && !callAccepted) {
          console.log("⏳ Initiateur audio - en attente d'acceptation distante...");
          setStatus("En attente d'acceptation...");
          return;
        }

        createPeerConnection();

        // Si on est callee (isInitiator === false) : une fois la PeerConnection et
        // le stream locaux prêts, on notifie le serveur qu'on est prêt (answer-call)
        if (!currentCall.isInitiator) {
          try {
            if (globalSocket?.connected) {
              console.log('📨 Callee prêt - envoi answer-call au serveur');
              globalSocket.emit('answer-call', {
                conversationId: currentCall.conversation?._id,
                fromUserId: currentCall.targetUserId,
                callId: currentCall.callId
              });
              // Marquer localement que l'appel est accepté/ready
              setCallAccepted(true);
            }
          } catch (e) {
            console.warn('Erreur émission answer-call depuis callee:', e);
          }
        }

        // Si on est l'initiateur, créer et envoyer une OFFER
        if (currentCall.isInitiator && pcRef.current) {
          console.log("📞 Création de l'OFFER (initiateur audio)...");
          console.log("🔍 Vérification targetUserId:", currentCall.targetUserId);
          
          if (!currentCall.targetUserId) {
            console.error("❌ ERREUR CRITIQUE: targetUserId est undefined!");
            setStatus("Erreur: ID cible manquant");
            return;
          }
          
          try {
            const offerOptions = {
              offerToReceiveAudio: 1,
              offerToReceiveVideo: 0
            };
            
            const offer = await pcRef.current.createOffer(offerOptions);
            console.log("📦 OFFER audio créée");
            
            await pcRef.current.setLocalDescription(offer);
            console.log("📋 LocalDescription définie");
            
            console.log("📤 Envoi de l'OFFER à:", currentCall.targetUserId);
            
            globalSocket.emit("offer", {
              conversationId: currentCall.conversation?._id,
              sdp: offer,
              toUserId: currentCall.targetUserId,
              callId: currentCall.callId
            });
            
            setStatus(`Appel vocal vers ${currentCall.targetUsername || "Utilisateur"}...`);
          } catch (error) {
            console.error("❌ Erreur création/envoi OFFER:", error);
            setStatus("Erreur lors de l'appel");
          }
        } else {
          console.log("📞 En attente d'appel vocal entrant...");
          setStatus("En attente d'appel vocal entrant...");
        }

      } catch (error) {
        console.error("❌ Erreur initialisation appel audio:", error);
        isInitializedRef.current = false;
        setStatus(`Erreur: ${error.message}`);
      }
    };

    initCall();

    return () => {
      console.log("🧹 Nettoyage du composant AudioCall");
      cleanupResources();
    };
  }, [currentCall, user, globalSocket, callType, callAccepted]);

  const otherUser = currentCall.targetUsername || "Utilisateur";

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "#0f0f0f",
      color: "white",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Contenu principal */}
      <div style={{
        textAlign: "center",
        padding: "40px",
        maxWidth: "600px"
      }}>
        {/* Icône de profil - Jaune */}
        <div style={{
          width: 120,
          height: 120,
          borderRadius: "20px",
          background: "#F9EE34",
          margin: "0 auto 30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 60,
          boxShadow: "0 4px 16px rgba(249, 238, 52, 0.3)"
        }}>
          🎤
        </div>

        {/* Nom du contact */}
        <h1 style={{ 
          margin: "0 0 10px 0", 
          fontSize: 32,
          fontWeight: "600",
          color: "#fff"
        }}>
          {otherUser}
        </h1>

        {/* Statut */}
        <p style={{ 
          fontSize: 16, 
          margin: "10px 0",
          opacity: 0.8,
          color: "#aaa"
        }}>
          {status}
        </p>

        {/* Durée */}
        {isPeerConnected && (
          <p style={{ 
            margin: "20px 0", 
            fontSize: 26, 
            fontWeight: "600", 
            color: "#F9EE34" 
          }}>
            {formatDuration(callDuration)}
          </p>
        )}

        {!isPeerConnected && (
          <div style={{
            marginTop: "20px",
            fontSize: "14px",
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            alignItems: "center",
            color: "#888"
          }}>
            <div style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#F9EE34",
              animation: "pulse 1.5s infinite"
            }}></div>
            Connexion en cours...
          </div>
        )}
      </div>

      {/* Contrôles - Design sobre */}
      <div style={{
        display: "flex",
        gap: "16px",
        justifyContent: "center",
        padding: "30px",
        position: "absolute",
        bottom: "40px",
        flexWrap: "wrap"
      }}>
        {/* Bouton Raccrocher */}
        <button
          onClick={handleEndCall}
          style={{
            background: "rgba(200, 60, 60, 0.9)",
            color: "white",
            padding: "14px 28px",
            borderRadius: "12px",
            border: "none",
            fontSize: "15px",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: "140px",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(200, 60, 60, 0.3)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(200, 60, 60, 1)";
            e.target.style.boxShadow = "0 6px 16px rgba(200, 60, 60, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(200, 60, 60, 0.9)";
            e.target.style.boxShadow = "0 4px 12px rgba(200, 60, 60, 0.3)";
          }}
        >
          📞 Raccrocher
        </button>

        {/* Bouton Micro */}
        <button
          onClick={toggleMute}
          style={{
            background: isMuted ? "rgba(200, 60, 60, 0.9)" : "rgba(249, 238, 52, 0.15)",
            color: isMuted ? "white" : "#F9EE34",
            padding: "14px 28px",
            borderRadius: "12px",
            border: isMuted ? "none" : "1px solid rgba(249, 238, 52, 0.3)",
            fontSize: "15px",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: "140px",
            justifyContent: "center",
            boxShadow: isMuted ? "0 4px 12px rgba(200, 60, 60, 0.3)" : "none",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            if (!isMuted) {
              e.target.style.background = "rgba(249, 238, 52, 0.25)";
              e.target.style.borderColor = "rgba(249, 238, 52, 0.5)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isMuted) {
              e.target.style.background = "rgba(249, 238, 52, 0.15)";
              e.target.style.borderColor = "rgba(249, 238, 52, 0.3)";
            }
          }}
        >
          {isMuted ? "🎤 Micro OFF" : "🎤 Couper"}
        </button>
      </div>

      {/* Audio element pour recevoir l'audio distant */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />

      {/* CSS pour animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}