// frontend/src/services/WebRTCService.js
class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.dataChannel = null;
    this.onSignalCallback = null;
    this.onStreamCallback = null;
    this.onScreenShareStopCallback = null;
  }

  async getLocalStream() {
    try {
      if (this.localStream) {
        return this.localStream;
      }

      console.log('🎥 Demande d\'accès média...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.localStream = stream;
      console.log('✅ Stream local obtenu');
      return stream;
      
    } catch (error) {
      console.error('❌ Erreur accès média:', error);
      throw error;
    }
  }

createPeerConnection(isInitiator = false) {
  // Fermer l'ancienne connexion si elle existe
  if (this.peerConnection) {
    console.log('⚠️ Fermeture PeerConnection existante');
    this.peerConnection.close();
    this.peerConnection = null;
  }

  console.log('🔗 Création RTCPeerConnection, initiator:', isInitiator);
  
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };
  
  this.peerConnection = new RTCPeerConnection(configuration);
  
  // Ajouter le stream local
  if (this.localStream) {
    this.localStream.getTracks().forEach(track => {
      console.log(`📤 Ajout track ${track.kind} à la connexion`);
      this.peerConnection.addTrack(track, this.localStream);
    });
  }
  
  // Gérer les candidats ICE
  this.peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('📡 Nouveau candidat ICE');
      if (this.onSignalCallback) {
        this.onSignalCallback({
          type: 'candidate',
          candidate: event.candidate
        });
      }
    }
  };
  
  // Gérer le stream distant
  this.peerConnection.ontrack = (event) => {
    console.log('✅ Track distant reçu:', event.track.kind);
    
    if (!this.remoteStream) {
      this.remoteStream = new MediaStream();
    }
    
    this.remoteStream.addTrack(event.track);
    
    if (this.onStreamCallback) {
      this.onStreamCallback(this.remoteStream);
    }
  };
  
  // Gérer les états
  this.peerConnection.oniceconnectionstatechange = () => {
    console.log('🌐 État ICE:', this.peerConnection.iceConnectionState);
    
    if (this.peerConnection.iceConnectionState === 'connected') {
      console.log('✅ Connexion WebRTC établie !');
    } else if (this.peerConnection.iceConnectionState === 'failed') {
      console.error('❌ Connexion ICE échouée');
    }
  };
  
  return this.peerConnection;
}

  setupDataChannel() {
    if (!this.dataChannel) return;
    
    this.dataChannel.onopen = () => {
      console.log('📨 Canal de données ouvert');
    };
    
    this.dataChannel.onclose = () => {
      console.log('📨 Canal de données fermé');
    };
    
    this.dataChannel.onmessage = (event) => {
      console.log('📨 Message reçu:', event.data);
    };
  }
   async createOffer() {
  const offer = await this.peerConnection.createOffer();
  await this.peerConnection.setLocalDescription(offer);

  this.onSignalCallback({
    type: 'offer',
    sdp: offer
  });
}
//
async createAnswer() {
  const answer = await this.peerConnection.createAnswer();
  await this.peerConnection.setLocalDescription(answer);

  this.onSignalCallback({
    type: 'answer',
    sdp: answer
  });
}
 async setRemoteDescription(signal) {
  if (!this.peerConnection) return;

  await this.peerConnection.setRemoteDescription(
    new RTCSessionDescription(signal.sdp)
  );
}


  async addIceCandidate(candidate) {
    if (!this.peerConnection) {
      throw new Error('PeerConnection non initialisée');
    }
    
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ Candidat ICE ajouté');
    } catch (error) {
      console.error('❌ Erreur ajout candidat ICE:', error);
    }
  }
  async handleAnswer(signal) {
  await this.peerConnection.setRemoteDescription(
    new RTCSessionDescription(signal.sdp)
  );
}

  onSignal(callback) {
    this.onSignalCallback = callback;
  }

  onStream(callback) {
    this.onStreamCallback = callback;
  }

  onScreenShareStop(callback) {
    this.onScreenShareStopCallback = callback;
  }

  stopAllStreams() {
    console.log('🧹 Nettoyage des streams...');
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        console.log(`⏹️ Arrêt track ${track.kind}`);
        track.stop();
      });
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    this.remoteStream = null;
    this.dataChannel = null;
    console.log('✅ Streams nettoyés');
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('🎤 Micro:', audioTrack.enabled ? 'activé' : 'désactivé');
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log('📷 Caméra:', videoTrack.enabled ? 'activée' : 'désactivée');
        return videoTrack.enabled;
      }
    }
    return false;
  }

  async startScreenShare(remoteUserId) {
    try {
      console.log('🖥️ Démarrage partage d\'écran...');

      // Obtenir le stream d'écran
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false // Pas d'audio pour le partage d'écran
      });

      // Sauvegarder la track vidéo originale
      this.originalVideoTrack = this.localStream.getVideoTracks()[0];

      // Remplacer la track vidéo dans le stream local
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      this.localStream.removeTrack(this.originalVideoTrack);
      this.localStream.addTrack(screenVideoTrack);

      // Remplacer la track dans la connexion peer
      if (this.peerConnection) {
        const sender = this.peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenVideoTrack);
        }
      }

      // Écouter la fin du partage d'écran
      screenVideoTrack.onended = () => {
        console.log('🖥️ Partage d\'écran terminé par l\'utilisateur');
        this.stopScreenShare();
      };

      console.log('✅ Partage d\'écran démarré');
      return screenStream;

    } catch (error) {
      console.error('❌ Erreur démarrage partage d\'écran:', error);
      throw error;
    }
  }

  async stopScreenShare() {
    try {
      console.log('🖥️ Arrêt partage d\'écran...');

      if (!this.originalVideoTrack) {
        console.warn('⚠️ Aucune track vidéo originale trouvée');
        return;
      }

      // Récupérer la track d'écran actuelle
      const screenTrack = this.localStream.getVideoTracks()[0];

      // Remplacer dans le stream local
      this.localStream.removeTrack(screenTrack);
      this.localStream.addTrack(this.originalVideoTrack);

      // Remplacer dans la connexion peer
      if (this.peerConnection) {
        const sender = this.peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          await sender.replaceTrack(this.originalVideoTrack);
        }
      }

      // Arrêter la track d'écran
      screenTrack.stop();

      // Nettoyer
      this.originalVideoTrack = null;

      // Notifier l'arrêt du partage d'écran
      if (this.onScreenShareStopCallback) {
        this.onScreenShareStopCallback();
      }

      console.log('✅ Partage d\'écran arrêté');

    } catch (error) {
      console.error('❌ Erreur arrêt partage d\'écran:', error);
      throw error;
    }
  }

  isScreenSharing() {
    return this.originalVideoTrack !== null && this.originalVideoTrack !== undefined;
  }
}

// Export singleton
const webRTCService = new WebRTCService();
export default webRTCService;