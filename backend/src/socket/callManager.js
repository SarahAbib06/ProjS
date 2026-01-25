// src/utils/callManager.js
class CallManager {
  /**
   * Démarrer un appel vidéo depuis une conversation
   * @param {string} conversationId - ID de la conversation
   * @param {string} userId - ID de l'utilisateur actuel
   * @param {boolean} isVideoCall - true pour vidéo, false pour vocal
   * @returns {Promise<Object>} - Résultat de l'appel
   */
  static async startCallFromConversation(conversationId, userId, isVideoCall = true) {
    try {
      console.log(`📞 Lancement appel ${isVideoCall ? 'vidéo' : 'vocal'} depuis conversation:`, conversationId);
      
      // Récupérer le token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Utilisateur non authentifié");
      }

      // 1. Récupérer les participants de la conversation
      const participantsResponse = await fetch(
        `http://localhost:5000/api/conversations/${conversationId}/participants`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!participantsResponse.ok) {
        throw new Error("Impossible de récupérer les participants");
      }

      const participantsData = await participantsResponse.json();
      const participants = participantsData.participants || [];

      if (participants.length < 2) {
        throw new Error("Pas assez de participants pour un appel");
      }

      // 2. Trouver l'autre participant (pour les conversations 1-to-1)
      let targetParticipant = null;
      if (participants.length === 2) {
        // Conversation 1-to-1 : trouver l'autre participant
        targetParticipant = participants.find(p => p.userId !== userId);
      } else {
        // Conversation de groupe : on prendra le premier autre participant
        targetParticipant = participants.find(p => p.userId !== userId);
      }

      if (!targetParticipant) {
        throw new Error("Aucun participant disponible pour l'appel");
      }

      // 3. Vérifier la disponibilité de l'utilisateur cible
      const availabilityResponse = await fetch(
        `http://localhost:5000/api/users/${targetParticipant.userId}/availability`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      let isTargetAvailable = false;
      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json();
        isTargetAvailable = availabilityData.isOnline;
      }

      // 4. Construire l'URL d'appel
      const callUrl = `/video-call?userId=${encodeURIComponent(userId)}&conversationId=${encodeURIComponent(conversationId)}&targetUserId=${encodeURIComponent(targetParticipant.userId)}&isVideo=${isVideoCall}`;
      
      // 5. Émettre un événement de début d'appel via WebSocket
      // (On suppose que vous avez un socket connecté)
      const socket = window.globalSocket || window.socket;
      if (socket && socket.connected) {
        socket.emit("call_initiated", {
          conversationId,
          fromUserId: userId,
          toUserId: targetParticipant.userId,
          callType: isVideoCall ? "video" : "audio",
          participants: participants.map(p => p.userId),
          timestamp: new Date()
        });
      }

      // 6. Notifier le serveur de l'appel entrant
      await fetch(`http://localhost:5000/api/calls/initiate`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId,
          callerId: userId,
          targetId: targetParticipant.userId,
          callType: isVideoCall ? "video" : "audio",
          participants: participants.map(p => p.userId)
        })
      });

      return {
        success: true,
        targetUserId: targetParticipant.userId,
        targetUsername: targetParticipant.username,
        targetStatus: targetParticipant.status,
        isOnline: isTargetAvailable,
        callUrl,
        participants: participants,
        isGroupCall: participants.length > 2
      };

    } catch (error) {
      console.error("❌ Erreur lors du lancement de l'appel:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ouvrir la page d'appel vidéo
   * @param {Object} callData - Données de l'appel
   */
  static openVideoCallPage(callData) {
    const { callUrl } = callData;
    
    // Ouvrir dans un nouvel onglet ou rediriger
    if (window.confirm(`Démarrer un appel ${callData.isVideoCall ? 'vidéo' : 'vocal'} avec ${callData.targetUsername}?`)) {
      window.open(callUrl, '_blank');
      // Ou rediriger dans la même fenêtre :
      // window.location.href = callUrl;
    }
  }

  /**
   * Démarrer un appel de groupe
   * @param {string} conversationId - ID de la conversation
   * @param {string} userId - ID de l'utilisateur actuel
   * @param {boolean} isVideoCall - true pour vidéo, false pour vocal
   */
  static async startGroupCall(conversationId, userId, isVideoCall = true) {
    try {
      const token = localStorage.getItem("token");
      
      // Récupérer les participants
      const response = await fetch(
        `http://localhost:5000/api/conversations/${conversationId}/participants`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error("Impossible de récupérer les participants");
      
      const data = await response.json();
      const participants = data.participants || [];

      // Filtrer l'utilisateur actuel
      const otherParticipants = participants.filter(p => p.userId !== userId);
      
      // Construire l'URL pour l'appel de groupe
      const participantIds = otherParticipants.map(p => p.userId).join(',');
      const callUrl = `/video-call?userId=${encodeURIComponent(userId)}&conversationId=${encodeURIComponent(conversationId)}&groupCall=true&participants=${participantIds}&isVideo=${isVideoCall}`;
      
      // Notifier tous les participants via WebSocket
      const socket = window.globalSocket || window.socket;
      if (socket && socket.connected) {
        otherParticipants.forEach(participant => {
          socket.emit("incoming_group_call", {
            conversationId,
            fromUserId: userId,
            fromUsername: socket.username || "Utilisateur",
            callType: isVideoCall ? "video" : "audio",
            timestamp: new Date()
          });
        });
      }

      // Ouvrir la page d'appel
      window.open(callUrl, '_blank');
      
      return {
        success: true,
        participants: otherParticipants,
        callUrl
      };
    } catch (error) {
      console.error("❌ Erreur appel de groupe:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default CallManager;