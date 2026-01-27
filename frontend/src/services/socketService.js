// frontend/src/services/socketService.js
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Connexion au serveur Socket.IO
  async connect(token) {
    if (this.socket?.connected) {
      console.log('✅ Socket déjà connecté');
      return this.socket;
    }

    // Nettoyer l'ancienne connexion si elle existe
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    console.log('🔌 Connexion Socket.IO à:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      withCredentials: true,
      extraHeaders: {
        'Origin': import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173'
      }
    });

    return new Promise((resolve, reject) => {
      // Événements de connexion
      this.socket.on('connect', () => {
        console.log('✅ Socket connecté - ID:', this.socket.id);
        this.isConnected = true;
        resolve(this.socket);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket déconnecté:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('💥 Erreur connexion Socket:', error.message);
        reject(error);
      });

      this.socket.on('error', (error) => {
        console.error('💥 Erreur Socket:', error);
        reject(error);
      });

      // Timeout après 10 secondes
      setTimeout(() => {
        reject(new Error('Timeout de connexion Socket'));
      }, 10000);
    });
  }

  // Déconnexion
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔴 Socket déconnecté manuellement');
    }
  }

  // ==================== CONVERSATIONS ====================

  // Rejoindre une conversation
  joinConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('join_conversation', conversationId);
      console.log('📱 Rejoint conversation:', conversationId);
    }
  }

  // Quitter une conversation
  leaveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('leave_conversation', conversationId);
      console.log('📱 Quitté conversation:', conversationId);
    }
  }

  // ==================== MESSAGES ====================

  // Envoyer un message texte
  sendMessage(messageData) {
    if (this.socket) {
      this.socket.emit('send_message', messageData);
      console.log('📨 Message envoyé:', messageData);
    }
  }

  // Envoyer une image
  sendImageMessage(imageData) {
    if (this.socket) {
      this.socket.emit('send_image_message', imageData);
      console.log('🖼️ Image envoyée');
    }
  }

  // Envoyer une vidéo
  sendVideoMessage(videoData) {
    if (this.socket) {
      this.socket.emit('send_video_message', videoData);
      console.log('🎥 Vidéo envoyée');
    }
  }

  // Envoyer un fichier
  sendFileMessage(fileData) {
    if (this.socket) {
      this.socket.emit('send_file_message', fileData);
      console.log('📎 Fichier envoyé');
    }
  }

  // Écouter les nouveaux messages
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  // Écouter les confirmations d'envoi
  onMessageSent(callback) {
    if (this.socket) {
      this.socket.on('message_sent', callback);
    }
  }

  // Écouter les erreurs de message
  onMessageError(callback) {
    if (this.socket) {
      this.socket.on('message_error', callback);
    }
  }

  // ==================== MESSAGES AUDIO ====================

  // Démarrer l'enregistrement audio
  startAudioRecording(conversationId, userId) {
    if (this.socket) {
      this.socket.emit('audio_stream_start', { conversationId, userId });
    }
  }

  // Arrêter l'enregistrement audio
  stopAudioRecording(conversationId, userId) {
    if (this.socket) {
      this.socket.emit('audio_stream_stop', { conversationId, userId });
    }
  }

  // Écouter l'enregistrement audio des autres
  onUserRecordingAudio(callback) {
    if (this.socket) {
      this.socket.on('user_recording_audio', callback);
    }
  }

  onUserStoppedRecording(callback) {
    if (this.socket) {
      this.socket.on('user_stopped_recording', callback);
    }
  }

  // Écouter les nouveaux messages audio
  onNewAudioMessage(callback) {
    if (this.socket) {
      this.socket.on('new_audio_message', callback);
    }
  }

  // ==================== RÉACTIONS ====================

  // Rejoindre l'écoute des réactions d'un message
  joinMessageReactions(messageId) {
    if (this.socket) {
      this.socket.emit('join_message_reactions', messageId);
    }
  }

  // Quitter l'écoute des réactions d'un message
  leaveMessageReactions(messageId) {
    if (this.socket) {
      this.socket.emit('leave_message_reactions', messageId);
    }
  }

  // Ajouter une réaction
  addReaction(messageId, emoji) {
    if (this.socket) {
      this.socket.emit('add_reaction', { messageId, emoji });
      console.log('🎯 Réaction ajoutée:', emoji);
    }
  }

  // Supprimer une réaction
  removeReaction(messageId) {
    if (this.socket) {
      this.socket.emit('remove_reaction', { messageId });
      console.log('🗑️ Réaction supprimée');
    }
  }

  // Écouter les réactions ajoutées
  onReactionAdded(callback) {
    if (this.socket) {
      this.socket.on('reaction_added', callback);
      this.socket.on('conversation_reaction_update', (data) => {
        if (data.type === 'reaction_added') {
          callback(data);
        }
      });
    }
  }

  // Écouter les réactions supprimées
  onReactionRemoved(callback) {
    if (this.socket) {
      this.socket.on('reaction_removed', callback);
      this.socket.on('conversation_reaction_update', (data) => {
        if (data.type === 'reaction_removed') {
          callback(data);
        }
      });
    }
  }

  // ==================== TYPING INDICATOR ====================

  // Envoyer le statut "en train d'écrire"
  sendTyping(conversationId, isTyping = true) {
    if (this.socket) {
      this.socket.emit('user_typing', { conversationId, isTyping });
    }
  }

  // Écouter quand quelqu'un écrit
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  // ==================== ARCHIVAGE ====================

  // Archiver une conversation
  archiveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('archive_conversation', { conversationId });
    }
  }

  // Désarchiver une conversation
  unarchiveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('unarchive_conversation', { conversationId });
    }
  }

  // Récupérer les conversations archivées
  getArchivedConversations() {
    if (this.socket) {
      this.socket.emit('get_archived_conversations');
    }
  }

  // Écouter les événements d'archivage
  onConversationArchived(callback) {
    if (this.socket) {
      this.socket.on('conversation_archived', callback);
    }
  }

  onConversationUnarchived(callback) {
    if (this.socket) {
      this.socket.on('conversation_unarchived', callback);
    }
  }

  onArchivedConversationsData(callback) {
    if (this.socket) {
      this.socket.on('archived_conversations_data', callback);
    }
  }

  // ==================== MESSAGES ÉPINGLÉS ====================

  // Écouter les messages épinglés
  onMessagePinned(callback) {
    if (this.socket) {
      this.socket.on('message:pinned', callback);
    }
  }

  // Écouter les messages désépinglés
  onMessageUnpinned(callback) {
    if (this.socket) {
      this.socket.on('message:unpinned', callback);
    }
  }

  // ==================== TRANSFERT DE MESSAGES ====================

  // Transférer un message
  forwardMessage(messageId, targetConversationId) {
    if (this.socket) {
      this.socket.emit('forward_message', { messageId, targetConversationId });
      console.log('📨 Message transféré');
    }
  }

  // Écouter le succès du transfert
  onForwardSuccess(callback) {
    if (this.socket) {
      this.socket.on('forward_success', callback);
    }
  }

  // Écouter les erreurs de transfert
  onForwardError(callback) {
    if (this.socket) {
      this.socket.on('forward_error', callback);
    }
  }

  // ==================== NOTIFICATIONS ====================

  // Rejoindre le canal des notifications
  joinNotifications() {
    if (this.socket) {
      this.socket.emit('join_notifications');
      console.log('🔔 Rejoint notifications');
    }
  }

  // Écouter les alertes de nouveaux messages
  onNewMessageAlert(callback) {
    if (this.socket) {
      this.socket.on('new_message_alert', callback);
    }
  }

  // Récupérer les compteurs non lus
  getUnreadCounts() {
    if (this.socket) {
      this.socket.emit('get_unread_counts');
    }
  }

  // Marquer une conversation comme lue
  markConversationRead(conversationId) {
    if (this.socket) {
      this.socket.emit('mark_conversation_read', { conversationId });
    }
  }

  // Écouter les compteurs non lus
  onUnreadCountsData(callback) {
    if (this.socket) {
      this.socket.on('unread_counts_data', callback);
    }
  }

  // ==================== PRÉSENCE ====================

  // Envoyer un heartbeat
  sendHeartbeat() {
    if (this.socket) {
      this.socket.emit('user_heartbeat');
    }
  }

  // Changer le statut
  changeStatus(status) {
    if (this.socket) {
      this.socket.emit('user_status_change', { status });
    }
  }

  // Écouter les changements de présence
  onUserPresenceChanged(callback) {
    if (this.socket) {
      this.socket.on('user_presence_changed', callback);
    }
  }
// ==================== APPELS VIDÉO ====================

  // Initier un appel vidéo
  initiateCall(conversationId, receiverId, callType = 'video') {
    if (this.socket) {
      this.socket.emit('call:initiate', { 
        conversationId, 
        receiverId,
        callType // 'video' ou 'audio'
      });
      console.log('📞 Appel initié vers:', receiverId);
    }
  }

  // Recevoir une demande d'appel entrant
  onIncomingCall(callback) {
    if (this.socket) {
      this.socket.on('call:incoming', callback);
    }
  }

  // Accepter un appel
  acceptCall(callId, callerId) {
    if (this.socket) {
      this.socket.emit('call:accept', { callId, callerId });
      console.log('✅ Appel accepté');
    }
  }

  // Rejeter un appel
  rejectCall(callId, callerId) {
    if (this.socket) {
      this.socket.emit('call:reject', { callId, callerId });
      console.log('❌ Appel rejeté');
    }
  }

  // Envoyer l'offre WebRTC
  sendCallOffer(receiverId, signal) {
    if (this.socket) {
      this.socket.emit('call:offer', { receiverId, signal });
    }
  }

  // Recevoir une offre WebRTC
  onCallOffer(callback) {
    if (this.socket) {
      this.socket.on('call:offer', callback);
    }
  }

  // Envoyer la réponse WebRTC
  sendCallAnswer(callerId, signal) {
    if (this.socket) {
      this.socket.emit('call:answer', { callerId, signal });
    }
  }

  // Recevoir une réponse WebRTC
  onCallAnswer(callback) {
    if (this.socket) {
      this.socket.on('call:answer', callback);
    }
  }

  // Terminer un appel
  endCall(userId) {
    if (this.socket) {
      this.socket.emit('call:end', { userId });
      console.log('📴 Appel terminé');
    }
  }

  // Écouter la fin d'appel
  onCallEnded(callback) {
    if (this.socket) {
      this.socket.on('call:ended', callback);
    }
  }

  // Appel rejeté
  onCallRejected(callback) {
    if (this.socket) {
      this.socket.on('call:rejected', callback);
    }
  }

  // Appel accepté
  onCallAccepted(callback) {
    if (this.socket) {
      this.socket.on('call:accepted', callback);
    }
  }

  
  
  // socketService.js
sendIceCandidate(receiverId, candidate) {
  if (this.socket) {
    this.socket.emit('call:ice-candidate', { receiverId, candidate });
  }
}

onIceCandidate(callback) {
  if (this.socket) {
    this.socket.on('call:ice-candidate', callback);
  }
}
// Ajoutez ces méthodes dans la classe SocketService
// Émetteurs sécurisés
emitScreenShareStart(remoteUserId, sharerId) {
  if (this.socket && this.socket.connected) {
    this.socket.emit('call:screen-share-start', { sharerId, remoteUserId });
  } else {
    console.warn("⚠️ Socket non connecté : impossible d'envoyer le signal de début");
  }
}

emitScreenShareStop(remoteUserId, sharerId) {
  if (this.socket && this.socket.connected) {
    console.log('📡 Envoi signal arrêt partage écran:', { sharerId, remoteUserId });
    this.socket.emit('call:screen-share-stop', { sharerId, remoteUserId });
  } else {
    console.warn("⚠️ Socket non connecté : impossible d'envoyer le signal d'arrêt");
  }
}

// Écouteurs
onScreenShareStarted(callback) {
  if (this.socket) this.socket.on('call:screen-share-start', callback);
}

onScreenShareStopped(callback) {
  if (this.socket) this.socket.on('call:screen-share-stop', callback);
}


  // ==================== MESSAGE REQUEST (DEMANDE DE MESSAGE) ====================

  // Écouter la réception d'une demande de message
  onMessageRequestReceived(callback) {
    if (this.socket) {
      this.socket.on('message_request_received', callback);
      console.log('Écouteur ajouté: message_request_received');
    }
  }

  // Écouter quand une demande est acceptée (par l'un ou l'autre)
  onMessageRequestAccepted(callback) {
    if (this.socket) {
      this.socket.on('message_request_accepted', callback);
      console.log('Écouteur ajouté: message_request_accepted');
    }
  }

  // ==================== HISTORIQUE ====================

  // Récupérer l'historique d'une conversation
  getConversationHistory(conversationId) {
    if (this.socket) {
      this.socket.emit('get_conversation_history', { conversationId });
    }
  }

  // Écouter la réception de l'historique
  onConversationHistory(callback) {
    if (this.socket) {
      this.socket.on('conversation_history', callback);
    }
  }

  // ==================== PARTAGE D'ÉCRAN ====================
/*
  // Écouter le démarrage du partage d'écran
  onScreenShareStarted(callback) {
    if (this.socket) {
      this.socket.on('screen-share-started', callback);
    }
  }

  // Écouter l'arrêt du partage d'écran
  onScreenShareStopped(callback) {
    if (this.socket) {
      this.socket.on('screen-share-stopped', callback);
    }
  }
*/




//###############################################################
  // ==================== APPELS VIDÉO/AUDIO ====================

  // Vérifier le type de conversation pour les appels
  checkCallType(conversationId, callback) {
    if (this.socket) {
      this.socket.emit("check-call-type", { conversationId }, callback);
    }
  }

  // Démarrer un appel (géré par le callManager)
  initiateCall(conversationId, callType, callerId, callerName) {
    if (this.socket) {
      this.socket.emit("initiate-call", {
        conversationId,
        callType,
        callerId,
        callerName
      });
    }
  }

  // Démarrer un appel de groupe
  initiateGroupCall(conversationId, callType, callerId, callerName) {
    if (this.socket) {
      this.socket.emit("initiate-group-call", {
        conversationId,
        callType,
        callerId,
        callerName
      });
    }
  }

  // Accepter un appel
  acceptCall(callId, conversationId) {
    if (this.socket) {
      this.socket.emit("accept-call", { callId, conversationId });
    }
  }

  // Rejeter un appel
  rejectCall(callId, reason) {
    if (this.socket) {
      this.socket.emit("reject-call", { callId, reason });
    }
  }

  // Annuler un appel (avant acceptation)
  cancelCall(callId) {
    if (this.socket) {
      this.socket.emit("cancel-call", { callId });
    }
  }

  // Terminer un appel
  endCall(callId) {
    if (this.socket) {
      this.socket.emit("end-call", { callId });
    }
  }

  // Rejoindre un appel de groupe
  joinGroupCall(callId) {
    if (this.socket) {
      this.socket.emit("join-group-call", { callId });
    }
  }

  // Quitter un appel de groupe
  leaveGroupCall(callId) {
    if (this.socket) {
      this.socket.emit("leave-group-call", { callId });
    }
  }

  // Signal WebRTC
  sendWebRTCSignal(callId, targetUserId, signal, type) {
    if (this.socket) {
      this.socket.emit("webrtc-signal", {
        callId,
        targetUserId,
        signal,
        type
      });
    }
  }

  // Signal WebRTC pour groupe
  sendGroupWebRTCSignal(callId, targetUserId, signal, type) {
    if (this.socket) {
      this.socket.emit("group-webrtc-signal", {
        callId,
        targetUserId,
        signal,
        type
      });
    }
  }

  // Changement de statut pendant l'appel
  sendCallStatusChange(callId, statusType, statusValue) {
    if (this.socket) {
      this.socket.emit("call-status-change", {
        callId,
        statusType,
        statusValue
      });
    }
  }

  // Démarrer le partage d'écran
  startScreenShare(callId) {
    if (this.socket) {
      this.socket.emit("screen-share-start", { callId });
    }
  }

  // Arrêter le partage d'écran
  stopScreenShare(callId) {
    if (this.socket) {
      this.socket.emit("screen-share-stop", { callId });
    }
  }

  // Écouter les appels entrants
  onIncomingCall(callback) {
    if (this.socket) {
      this.socket.on("incoming-call", callback);
    }
  }

  onIncomingGroupCall(callback) {
    if (this.socket) {
      this.socket.on("incoming-group-call", callback);
    }
  }

  // Écouter les événements d'appel
  onCallAccepted(callback) {
    if (this.socket) {
      this.socket.on("call-accepted", callback);
    }
  }

  onCallRejected(callback) {
    if (this.socket) {
      this.socket.on("call-rejected", callback);
    }
  }

  onCallCancelled(callback) {
    if (this.socket) {
      this.socket.on("call-cancelled", callback);
    }
  }

  onCallStarted(callback) {
    if (this.socket) {
      this.socket.on("call-started", callback);
    }
  }

  onCallEnded(callback) {
    if (this.socket) {
      this.socket.on("call-ended", callback);
    }
  }

  onCallFailed(callback) {
    if (this.socket) {
      this.socket.on("call-failed", callback);
    }
  }

  onCallError(callback) {
    if (this.socket) {
      this.socket.on("call-error", callback);
    }
  }

  // Écouter les signaux WebRTC
  onWebRTCSignal(callback) {
    if (this.socket) {
      this.socket.on("webrtc-signal", callback);
    }
  }

  onGroupWebRTCSignal(callback) {
    if (this.socket) {
      this.socket.on("group-webrtc-signal", callback);
    }
  }

  // Écouter les changements de statut des participants
  onParticipantStatusChanged(callback) {
    if (this.socket) {
      this.socket.on("participant-status-changed", callback);
    }
  }

  onParticipantDisconnected(callback) {
    if (this.socket) {
      this.socket.on("participant-disconnected", callback);
    }
  }

  // Écouter le partage d'écran
  onScreenShareStarted(callback) {
    if (this.socket) {
      this.socket.on("screen-share-started", callback);
    }
  }

  onScreenShareStopped(callback) {
    if (this.socket) {
      this.socket.on("screen-share-stopped", callback);
    }
  }

//###############################################################











  // ==================== UTILITAIRES ====================

  // Tester la connexion (ping/pong)
  ping() {
    if (this.socket) {
      this.socket.emit('ping');
    }
  }

  onPong(callback) {
    if (this.socket) {
      this.socket.on('pong', callback);
    }
  }

  // Retirer un écouteur
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Retirer tous les écouteurs d'un événement
  offAll(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
  }

  // Vérifier si connecté
  get connected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Export singleton
export const socketService = new SocketService();
export default socketService;