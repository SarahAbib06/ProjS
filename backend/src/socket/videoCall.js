// sockets/VideoCall.js
let users = {};
let currentSharer = null;

import Conversation from '../models/Conversation.js';
import jwt from 'jsonwebtoken';

export default function setupVideoCall(io) {

  // MIDDLEWARE D'AUTHENTIFICATION GLOBAL
  io.use(async (socket, next) => {
    try {
      console.log("Tentative auth WebSocket vidéo...");

      // Récupérer le token du handshake
      const token = socket.handshake.auth.token;

      if (!token) {
        console.log(" Token manquant dans handshake.auth");
        return next(new Error("Token manquant"));
      }

      const cleanToken = token.replace("Bearer ", "");
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

      // Vérifier que l'utilisateur existe
      const User = await import('../models/User.js').then(module => module.default);
      const user = await User.findById(decoded.id);

      if (!user) {
        console.log("Utilisateur non trouvé:", decoded.id);
        return next(new Error("Utilisateur non trouvé"));
      }

      // Attacher l'userId au socket
      socket.userId = user._id.toString();
      socket.username = user.username;
      socket.userAvatar = user.avatar; // 🆕 Ajouter l'avatar

      console.log("User authentifié pour vidéo:", socket.userId);
      next();

    } catch (error) {
      console.error("Auth WebSocket vidéo failed:", error.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket vidéo connecté:", socket.id, "- User:", socket.userId);

    // ENREGISTRER L'UTILISATEUR AUTOMATIQUEMENT
    if (socket.userId) {
      users[socket.userId] = socket.id;
      console.log("Registered user:", socket.userId, "->", socket.id);

      // Envoyer confirmation d'authentification
      socket.emit("video-auth-success", {
        userId: socket.userId,
        username: socket.username,
        avatar: socket.userAvatar // 🆕 Inclure l'avatar
      });
    }

    // ÉVÉNEMENT POUR INITIER UN APPEL À PARTIR D'UNE CONVERSATION
    socket.on("initiate-call", async ({ conversationId, callType = "video", callId }) => {
      try {
        const userId = socket.userId;
        if (!userId) {
          return socket.emit("call-error", { message: "Non authentifié" });
        }

        console.log("Initiation d'appel:", {
          conversationId,
          userId: userId,
          username: socket.username
        });

        // Récupérer la conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit("call-error", { message: "Conversation non trouvée" });
        }

        // Vérifier que l'utilisateur fait partie de la conversation
        const isParticipant = conversation.Id_participant.some(
          participant => participant.toString() === userId.toString()
        );

        if (!isParticipant) {
          return socket.emit("call-error", { message: "Vous n'êtes pas membre de cette conversation" });
        }

        // Trouver l'autre participant (pour les conversations privées)
        let otherParticipantId = null;
        console.log("🔍 DEBUG Participants dans conversation:", {
          participants: conversation.Id_participant.map(p => p.toString()),
          userId: userId,
          conversationType: conversation.type
        });

        if (conversation.type === "private") {
          otherParticipantId = conversation.Id_participant.find(
            participant => {
              const participantStr = participant.toString();
              const match = participantStr !== userId.toString();
              console.log("🔍 Checking participant:", { participantStr, userId, match });
              return match;
            }
          );

          console.log("🔍 otherParticipantId trouvé:", otherParticipantId?.toString());

          if (!otherParticipantId) {
            return socket.emit("call-error", { message: "Participant non trouvé" });
          }
        } else if (conversation.type === "group") {
          return socket.emit("call-error", { message: "Les appels de groupe ne sont pas encore supportés" });
        }

        // Vérifier si l'autre participant est connecté
        const targetSocketId = users[otherParticipantId];
        if (!targetSocketId) {
          return socket.emit("call-error", { message: "L'utilisateur n'est pas connecté" });
        }

        // Émettre l'appel entrant à l'autre participant
        io.to(targetSocketId).emit("incoming-call", {
          fromUserId: userId,
          fromUsername: socket.username,
          fromAvatar: socket.userAvatar, // 🆕 Ajouter l'avatar de l'appelant
          conversationId,
          conversationName: conversation.type === "private" ? null : conversation.groupName,
          callType,
          callId,
          timestamp: new Date()
        });

        // Confirmation à l'appelant
        socket.emit("call-initiated", {
          targetUserId: otherParticipantId,
          conversationId,
          callType,
          callId
        });

        console.log("Appel initié vers:", otherParticipantId);

      } catch (error) {
        console.error("Erreur initiation appel:", error);
        socket.emit("call-error", { message: error.message });
      }
    });

    // ÉVÉNEMENT POUR RÉPONDRE À UN APPEL
    socket.on("answer-call", async ({ conversationId, fromUserId, callId }) => {
      try {
        const userId = socket.userId;
        console.log('📥 answer-call reçu (destinataire prêt):', {
          fromUserId,
          conversationId,
          callId,
          userId
        });

        // 1. Notifier l'appelant que le destinataire a accepté
        let targetSocketId = users[fromUserId];
        if (!targetSocketId) {
          console.warn('⚠️ answer-call: targetSocket introuvable pour', fromUserId, '- tentative résolution via conversation');
          try {
            const conv = await Conversation.findById(conversationId);
            if (conv) {
              const other = conv.Id_participant.find(p => p.toString() !== userId.toString());
              if (other) {
                targetSocketId = users[other.toString()];
                console.log('🔍 answer-call: résolu autre participant ->', other.toString(), 'socketId:', targetSocketId);
              }
            }
          } catch (e) {
            console.warn('Erreur résolution conversation pour answer-call:', e.message);
          }
        }

        if (targetSocketId && targetSocketId !== socket.id) {
          io.to(targetSocketId).emit("call-answered", {
            fromUserId: userId,
            fromUsername: socket.username,
            conversationId,
            callId
          });
          console.log("✅ call-answered envoyé à:", { toSocket: targetSocketId, toUserId: fromUserId, fromUserId: userId, callId });
        } else if (targetSocketId === socket.id) {
          console.warn('⚠️ answer-call cible est le même socket que l\'émetteur, ignoré');
        } else {
          console.warn('⚠️ answer-call: impossible de trouver un socket cible pour', fromUserId);
        }
      } catch (error) {
        console.error("Erreur answer-call:", error);
      }
    });

    // 🆕 NOUVEL ÉVÉNEMENT: call-ready (le destinataire est prêt pour WebRTC)
    socket.on("call-ready", async ({ conversationId, fromUserId, callId }) => {
      try {
        const userId = socket.userId;
        console.log('🎯 call-ready reçu (destinataire prêt pour WebRTC):', { fromUserId, conversationId, callId, userId });

        const targetSocketId = users[fromUserId];
        if (targetSocketId && targetSocketId !== socket.id) {
          io.to(targetSocketId).emit("call-ready", {
            fromUserId: userId,
            fromUsername: socket.username,
            conversationId,
            callId
          });
          console.log("✅ call-ready relayé à:", fromUserId);
        } else if (!targetSocketId) {
          console.warn('⚠️ call-ready: socket cible non trouvé pour', fromUserId);
        }
      } catch (error) {
        console.error("❌ Erreur call-ready:", error);
      }
    });

    // ÉVÉNEMENT POUR REFUSER UN APPEL
    socket.on("reject-call", ({ conversationId, fromUserId, callId }) => {
      const userId = socket.userId;
      const targetSocket = users[fromUserId];

      if (targetSocket) {
        io.to(targetSocket).emit("call-rejected", {
          fromUserId: userId,
          fromUsername: socket.username,
          conversationId,
          callId
        });
        console.log("Appel refusé:", { fromUserId, toUserId: userId });
      }
    });

    // ÉVÉNEMENT POUR ANNULER UN APPEL (quand l'appelant raccroche avant réponse)
    socket.on("cancel-call", ({ conversationId, toUserId, callId }) => {
      const userId = socket.userId;
      const targetSocket = users[toUserId];

      if (targetSocket) {
        io.to(targetSocket).emit("call-cancelled", {
          fromUserId: userId,
          fromUsername: socket.username,
          conversationId,
          callId
        });
        console.log("Appel annulé:", { fromUserId: userId, toUserId });
      }
    });

    // OFFER (WebRTC)
    socket.on("offer", async ({ conversationId, sdp, toUserId, callId }) => {
      try {
        const userId = socket.userId;

        // Si toUserId absent ou pointe vers soi-même ou socket non trouvé,
        // tenter de récupérer l'autre participant via la conversation.
        let resolvedToUserId = toUserId;
        if (!toUserId || toUserId === userId || !users[toUserId]) {
          try {
            const conv = await Conversation.findById(conversationId);
            if (conv) {
              const other = conv.Id_participant.find(p => p.toString() !== userId.toString());
              if (other) resolvedToUserId = other.toString();
            }
          } catch (e) {
            console.warn('Impossible de résoudre toUserId depuis la conversation:', e.message);
          }
        }

        if (!resolvedToUserId || !users[resolvedToUserId]) {
          console.warn("⚠️ OFFER: Utilisateur cible introuvable après résolution:", { originalToUserId: toUserId, resolvedToUserId });
          console.warn("  Users connectés:", Object.keys(users));
          return socket.emit("call-error", { message: "Utilisateur cible non connecté" });
        }

        const targetSocket = users[resolvedToUserId];
        console.log("📤 Envoi OFFER:", {
          fromUserId: userId,
          toUserId: resolvedToUserId,
          targetSocket: targetSocket
        });
        if (targetSocket === socket.id) {
          console.warn('⚠️ OFFER cible est le même socket que l\'émetteur, émission ignorée');
        } else {
          io.to(targetSocket).emit("offer", {
            fromUserId: userId,
            fromUsername: socket.username,
            conversationId,
            sdp,
            callId
          });
          console.log("✅ Offer envoyé à:", resolvedToUserId);
        }
      } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'OFFER:", error);
        socket.emit("call-error", { message: "Erreur lors de l'envoi de l'OFFER" });
      }
    });

    // ANSWER (WebRTC)
    socket.on("answer", async ({ conversationId, sdp, toUserId, callId }) => {
      try {
        const userId = socket.userId;

        let resolvedToUserId = toUserId;
        if (!toUserId || toUserId === userId || !users[toUserId]) {
          try {
            const conv = await Conversation.findById(conversationId);
            if (conv) {
              const other = conv.Id_participant.find(p => p.toString() !== userId.toString());
              if (other) resolvedToUserId = other.toString();
            }
          } catch (e) {
            console.warn('Impossible de résoudre toUserId depuis la conversation (ANSWER):', e.message);
          }
        }

        if (!resolvedToUserId || !users[resolvedToUserId]) {
          console.warn("⚠️ ANSWER: Utilisateur cible introuvable après résolution:", { originalToUserId: toUserId, resolvedToUserId });
          return;
        }

        const targetSocket = users[resolvedToUserId];
        console.log("📥 Envoi ANSWER:", {
          fromUserId: userId,
          toUserId: resolvedToUserId,
          targetSocket: targetSocket
        });
        if (targetSocket === socket.id) {
          console.warn('⚠️ ANSWER cible est le même socket que l\'émetteur, émission ignorée');
        } else {
          io.to(targetSocket).emit("answer", {
            sdp,
            fromUserId: userId,
            fromUsername: socket.username,
            conversationId,
            callId
          });
          console.log("✅ Answer envoyé à:", resolvedToUserId);
        }
      } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'ANSWER:", error);
      }
    });

    // ICE CANDIDATE (WebRTC)
    socket.on("ice-candidate", async ({ conversationId, candidate, toUserId, callId }) => {
      try {
        const userId = socket.userId;

        let resolvedToUserId = toUserId;
        if (!toUserId || toUserId === userId || !users[toUserId]) {
          try {
            const conv = await Conversation.findById(conversationId);
            if (conv) {
              const other = conv.Id_participant.find(p => p.toString() !== userId.toString());
              if (other) resolvedToUserId = other.toString();
            }
          } catch (e) {
            console.warn('Impossible de résoudre toUserId depuis la conversation (ICE):', e.message);
          }
        }

        if (!resolvedToUserId || !users[resolvedToUserId] || !candidate) {
          if (!candidate) console.warn("⚠️ ICE: candidate manquant");
          console.warn("⚠️ ICE: Utilisateur cible introuvable après résolution:", { originalToUserId: toUserId, resolvedToUserId });
          return;
        }

        const targetSocket = users[resolvedToUserId];
        console.log("🧊 Relais ICE candidate de", userId, "vers", resolvedToUserId);
        if (targetSocket === socket.id) {
          console.warn('⚠️ ICE relay cible est le même socket que l\'émetteur, émission ignorée');
        } else {
          io.to(targetSocket).emit("ice-candidate", {
            candidate,
            fromUserId: userId,
            fromUsername: socket.username,
            conversationId,
            callId
          });
        }
      } catch (error) {
        console.error("❌ Erreur lors de l'envoi du ICE candidate:", error);
      }
    });

    // Raccrocher
    socket.on("hang-up", async ({ conversationId, toUserId, callId }) => {
      try {
        const userId = socket.userId;

        // Déterminer la liste des destinataires: si conversationId fourni,
        // notifier tous les participants sauf l'émetteur. Sinon, utiliser toUserId.
        let targetUserIds = [];

        if (conversationId) {
          try {
            const conv = await Conversation.findById(conversationId);
            if (conv && conv.Id_participant && conv.Id_participant.length) {
              targetUserIds = conv.Id_participant.map(p => p.toString()).filter(id => id !== userId);
            }
          } catch (e) {
            console.warn('Impossible de récupérer la conversation pour hang-up:', e.message);
          }
        }

        if (toUserId) {
          // garantir unicité
          if (!targetUserIds.includes(toUserId) && toUserId !== userId) targetUserIds.push(toUserId);
        }

        // Si toujours vide, tenter une résolution simple
        if (targetUserIds.length === 0) {
          const fallback = Object.keys(users).find(uid => uid !== userId);
          if (fallback) targetUserIds.push(fallback);
        }

        // Émettre hang-up à chaque socket cible connecté
        for (const tid of targetUserIds) {
          const targetSocket = users[tid];
          if (targetSocket) {
            io.to(targetSocket).emit("hang-up", {
              fromUserId: userId,
              fromUsername: socket.username,
              conversationId,
              callId
            });
            console.log("Appel raccroché (relay):", { fromUserId: userId, toUserId: tid });
          }
        }

        // Si l'appelant partageait son écran → libérer
        if (currentSharer === socket.id) {
          currentSharer = null;
        }
      } catch (error) {
        console.error("❌ Erreur lors du hang-up:", error);
      }
    });

    // Indiquer qu'un client a établi sa connexion WebRTC (pour synchroniser l'UI)
    socket.on('call-established', async ({ conversationId, toUserId, callId }) => {
      try {
        const userId = socket.userId;
        let resolvedToUserId = toUserId;
        if (!toUserId || toUserId === userId || !users[toUserId]) {
          try {
            const conv = await Conversation.findById(conversationId);
            if (conv) {
              const other = conv.Id_participant.find(p => p.toString() !== userId.toString());
              if (other) resolvedToUserId = other.toString();
            }
          } catch (e) {
            console.warn('Impossible de résoudre toUserId depuis la conversation (call-established):', e.message);
          }
        }

        if (resolvedToUserId && users[resolvedToUserId]) {
          const targetSocket = users[resolvedToUserId];
          io.to(targetSocket).emit('call-established', {
            fromUserId: userId,
            fromUsername: socket.username,
            conversationId,
            callId
          });
          console.log('🔗 call-established relayé de', userId, 'vers', resolvedToUserId);
        }
      } catch (e) {
        console.error('Erreur call-established:', e.message);
      }
    });

    // Partage d'écran : Start
    socket.on("start-screen-share", ({ conversationId, toUserId }) => {
      if (currentSharer === null) {
        currentSharer = socket.id;
        const targetSocket = users[toUserId];
        if (targetSocket) {
          io.to(targetSocket).emit("start-screen-share", {
            fromUserId: socket.userId,
            fromUsername: socket.username
          });
          console.log("Partage d'écran démarré vers:", toUserId);
        }
      } else {
        socket.emit("screen-share-denied", { message: "Quelqu'un partage déjà son écran" });
      }
    });

    // Partage d'écran : Stop
    socket.on("stop-screen-share", ({ conversationId, toUserId }) => {
      if (currentSharer === socket.id) {
        currentSharer = null;
        const targetSocket = users[toUserId];
        if (targetSocket) {
          io.to(targetSocket).emit("stop-screen-share", {
            fromUserId: socket.userId,
            fromUsername: socket.username
          });
          console.log("Partage d'écran arrêté");
        }
      }
    });

    // Mettre en pause/reprendre le flux vidéo
    socket.on("toggle-video", ({ conversationId, toUserId, isVideoOn }) => {
      try {
        if (!toUserId || !users[toUserId]) return;
        const targetSocket = users[toUserId];
        io.to(targetSocket).emit("video-toggled", {
          fromUserId: socket.userId,
          fromUsername: socket.username,
          isVideoOn
        });
      } catch (error) {
        console.error("❌ Erreur toggle-video:", error);
      }
    });

    // Mettre en sourdine/reprendre l'audio
    socket.on("toggle-audio", ({ conversationId, toUserId, isAudioOn }) => {
      try {
        if (!toUserId || !users[toUserId]) return;
        const targetSocket = users[toUserId];
        io.to(targetSocket).emit("audio-toggled", {
          fromUserId: socket.userId,
          fromUsername: socket.username,
          isAudioOn
        });
      } catch (error) {
        console.error("❌ Erreur toggle-audio:", error);
      }
    });

    // Envoyer un message texte pendant l'appel
    socket.on("call-message", ({ conversationId, toUserId, message }) => {
      try {
        if (!toUserId || !users[toUserId] || !message) return;
        const targetSocket = users[toUserId];
        io.to(targetSocket).emit("call-message-received", {
          fromUserId: socket.userId,
          fromUsername: socket.username,
          message,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("❌ Erreur call-message:", error);
      }
    });

    // ÉVÉNEMENT POUR S'ENREGISTRER MANUELLEMENT (au cas où)
    socket.on("register-user", (userId) => {
      if (socket.userId && socket.userId === userId) {
        users[userId] = socket.id;
        console.log("User enregistré manuellement:", userId, "->", socket.id);
      }
    });

    // VÉRIFIER SI UN UTILISATEUR EST CONNECTÉ
    socket.on("check-user-online", ({ userId }) => {
      const isOnline = users[userId] !== undefined;
      socket.emit("user-online-status", {
        userId,
        isOnline,
        socketId: users[userId]
      });
    });

    // DÉCONNEXION
    socket.on("disconnect", () => {
      console.log("Socket vidéo déconnecté:", socket.id, "- User:", socket.userId);

      // Retirer l'utilisateur de la map
      if (socket.userId && users[socket.userId] === socket.id) {
        delete users[socket.userId];
        console.log("User retiré:", socket.userId);
      }

      // Si un partage d'écran était en cours → notifier les autres
      if (currentSharer === socket.id) {
        currentSharer = null;
        console.log("Partage d'écran arrêté (déconnexion)");
      }
    });

    // GESTION DES ERREURS
    socket.on("error", (error) => {
      console.error("Erreur socket vidéo:", error);
    });
  });

  // FONCTION UTILITAIRE POUR EXPORTER LES UTILISATEURS CONNECTÉS
  const getConnectedUsers = () => {
    return users;
  };

  // Exposer la fonction si besoin
  return { getConnectedUsers };
}