import { messageController } from "../controllers/messageController.js";
import { conversationController } from "../controllers/conversationController.js";
import Participants from "../models/Participants.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Reaction from "../models/Reaction.js";
import Call from "../models/Call.js"; // 🆕 IMPORT DU MODÈLE CALL
import jwt from "jsonwebtoken";
import { archiveSocketService } from "../services/archiveSocketService.js";

export const configureChatSockets = (io) => {
  console.log("🔧 WebSocket configuré - Système présence avancé activé");

  // 🆕 STOCKAGE PRÉSENCE AVANCÉ
  const userPresence = new Map();

  // 🆕 PARTAGE DE LA PRÉSENCE AVEC LE CONTROLLER
  messageController.setUserPresence(userPresence);

  // 🆕 MIDDLEWARE AUTHENTIFICATION WEBSOCKET
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.authorization;

      if (!token) {
        return next(new Error("Token manquant"));
      }

      const cleanToken = token.replace("Bearer ", "");
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error("Utilisateur non trouvé"));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (error) {
      console.error("❌ Auth WebSocket failed:", error.message);
      next(new Error("Authentication failed"));
    }
  });

  // 🆕 FONCTION POUR SAUVEGARDER UN APPEL DANS LA BDD
  const saveCallToDB = async (callData) => {
    try {
      const { conversationId, callerId, receiverId, callType, status, duration, startTime } = callData;
      
      const callRecord = new Call({
        conversationId,
        callerId,
        receiverId,
        callType,
        startTime: startTime || new Date(),
        endTime: new Date(),
        duration: duration || 0,
        status
      });
      
      await callRecord.save();
      console.log(`✅ Appel sauvegardé dans la BDD: ${callRecord._id} (${callType}, ${status}, ${duration}s)`);
      return callRecord;
    } catch (error) {
      console.error('❌ Erreur sauvegarde appel:', error);
      return null;
    }
  };

  // 🆕 FONCTION POUR TROUVER LE RECEIVER ID DANS UNE CONVERSATION
  const findReceiverId = async (conversationId, callerId) => {
    try {
      const participants = await Participants.find({
        Id_Conversation: conversationId
      }).lean();
      
      const otherParticipant = participants.find(
        p => p.Id_User.toString() !== callerId.toString()
      );
      
      return otherParticipant?.Id_User || null;
    } catch (error) {
      console.error('❌ Erreur recherche receiverId:', error);
      return null;
    }
  };

  io.on("connection", (socket) => {
    console.log("🔗 User connecté:", socket.userId, "- Socket:", socket.id);

    let presenceInterval = null;

    // ==================== 🎯 RÉACTIONS EN TEMPS RÉEL ====================

    socket.on("join_message_reactions", (messageId) => {
      socket.join(`message_${messageId}`);
      console.log(
        `🔔 User ${socket.userId} écoute les réactions du message: ${messageId}`
      );
    });

    socket.on("leave_message_reactions", (messageId) => {
      socket.leave(`message_${messageId}`);
      console.log(
        `🔔 User ${socket.userId} ne suit plus les réactions du message: ${messageId}`
      );
    });

    socket.on("add_reaction", async (data) => {
      try {
        const { messageId, emoji } = data;
        const userId = socket.userId;

        console.log("🎯 Ajout réaction via socket:", {
          messageId,
          emoji,
          userId,
        });

        if (!messageId || !emoji) {
          throw new Error("Message ID et emoji requis");
        }

        // Vérifier si la réaction existe déjà
        const existingReaction = await Reaction.findOne({
          Id_message: messageId,
          id_user: userId,
        });

        if (existingReaction) {
          socket.emit("reaction_error", {
            error: "Vous avez déjà réagi à ce message",
            messageId,
          });
          return;
        }

        // Créer la réaction
        const reaction = new Reaction({
          Id_message: messageId,
          id_user: userId,
          emoji,
        });
        await reaction.save();
        await reaction.populate("id_user", "username avatar");

        // Récupérer le message pour avoir l'ID de conversation
        const Message = await import("../models/Message.js");
        const message = await Message.default.findById(messageId);

        // 🆕 DIFFUSER LA RÉACTION À TOUS LES UTILISATEURS CONCERNÉS
        // 1. Aux utilisateurs qui écoutent ce message spécifique
        socket.to(`message_${messageId}`).emit("reaction_added", {
          reaction,
          messageId,
          userId,
          timestamp: new Date(),
        });

        // 2. À tous les participants de la conversation
        if (message && message.conversationId) {
          io.to(message.conversationId.toString()).emit(
            "conversation_reaction_update",
            {
              type: "reaction_added",
              messageId: messageId,
              conversationId: message.conversationId,
              reaction: reaction,
              user: reaction.id_user,
              timestamp: new Date(),
            }
          );
        }

        // 3. Confirmation à l'émetteur
        socket.emit("reaction_added_success", {
          reaction,
          messageId,
          timestamp: new Date(),
        });

        console.log(
          `✅ Réaction ajoutée en temps réel: ${emoji} sur message ${messageId}`
        );
      } catch (error) {
        console.error("💥 Erreur ajout réaction socket:", error);
        socket.emit("reaction_error", {
          error: error.message,
          code: error.code,
        });
      }
    });

    socket.on("remove_reaction", async (data) => {
      try {
        const { messageId } = data;
        const userId = socket.userId;

        console.log("🗑️ Suppression réaction via socket:", {
          messageId,
          userId,
        });

        const reaction = await Reaction.findOneAndDelete({
          Id_message: messageId,
          id_user: userId,
        });

        if (!reaction) {
          socket.emit("reaction_error", {
            error: "Réaction non trouvée",
            messageId,
          });
          return;
        }

        // Récupérer le message pour avoir l'ID de conversation
        const Message = await import("../models/Message.js");
        const message = await Message.default.findById(messageId);

        // 🆕 DIFFUSER LA SUPPRESSION
        socket.to(`message_${messageId}`).emit("reaction_removed", {
          messageId,
          userId,
          emoji: reaction.emoji,
          timestamp: new Date(),
        });

        if (message && message.conversationId) {
          io.to(message.conversationId.toString()).emit(
            "conversation_reaction_update",
            {
              type: "reaction_removed",
              messageId: messageId,
              conversationId: message.conversationId,
              reaction: reaction,
              user: { _id: userId },
              timestamp: new Date(),
            }
          );
        }

        socket.emit("reaction_removed_success", {
          messageId,
          timestamp: new Date(),
        });
        console.log(
          `✅ Réaction supprimée en temps réel sur message ${messageId}`
        );
      } catch (error) {
        console.error("💥 Erreur suppression réaction socket:", error);
        socket.emit("reaction_error", { error: error.message });
      }
    });

    socket.on("get_message_reactions", async (data) => {
      try {
        const { messageId } = data;
        const reactions = await Reaction.find({ Id_message: messageId })
          .populate("id_user", "username avatar")
          .sort({ time: -1 });

        socket.emit("message_reactions_data", {
          success: true,
          messageId,
          reactions,
          count: reactions.length,
        });
      } catch (error) {
        socket.emit("reaction_error", { error: error.message });
      }
    });

    // ==================== 🔊 MESSAGES VOCAUX EN TEMPS RÉEL ====================

    socket.on("audio_stream_start", (data) => {
      const { conversationId, userId } = data;
      console.log("🎤 Début enregistrement audio - User:", userId);

      socket.to(conversationId).emit("user_recording_audio", {
        userId: userId,
        userName: socket.username || "Utilisateur",
        conversationId: conversationId,
        timestamp: new Date(),
      });
    });

    socket.on("audio_stream_stop", (data) => {
      const { conversationId, userId } = data;
      console.log("⏹️ Fin enregistrement audio - User:", userId);

      socket.to(conversationId).emit("user_stopped_recording", {
        userId: userId,
        conversationId: conversationId,
        timestamp: new Date(),
      });
    });

    socket.on("audio_message_played", (data) => {
      const { messageId, userId, conversationId } = data;
      console.log("🔊 Message audio joué:", messageId);

      socket.to(conversationId).emit("audio_message_status", {
        messageId: messageId,
        userId: userId,
        status: "played",
        timestamp: new Date(),
      });
    });

    socket.on("audio_message_download", (data) => {
      const { messageId, userId } = data;
      console.log("📥 Téléchargement message audio:", messageId);

      socket.emit("audio_download_started", {
        messageId: messageId,
        timestamp: new Date(),
      });
    });

    socket.on("audio_upload_success", (data) => {
      const { conversationId, message } = data;
      console.log("✅ Upload audio réussi - Diffusion en temps réel");

      io.to(conversationId).emit("new_audio_message", {
        type: "audio",
        message: message,
        conversationId: conversationId,
        timestamp: new Date(),
      });
    });

    // ==================== TRANSFERT DE MESSAGE (FORWARD) EN TEMPS RÉEL ====================
    // Événement déclenché depuis le frontend quand l'utilisateur clique sur "Transférer"
    socket.on("forward_message", async (data) => {
      try {
        const { messageId, targetConversationId } = data;
        const userId = socket.userId;

        console.log("Message transféré via Socket.IO:", {
          messageId,
          targetConversationId,
          userId,
        });

        if (!messageId || !targetConversationId) {
          throw new Error("messageId et targetConversationId sont requis");
        }

        // Vérifie que l'utilisateur a accès à la conversation cible
        const hasAccess = await Participants.findOne({
          Id_Conversation: targetConversationId,
          Id_User: userId,
        });

        if (!hasAccess) {
          throw new Error("Vous n'êtes pas membre de la conversation cible");
        }

        // On passe io et req.user dans la requête simulée
        const fakeReq = {
          params: { messageId },
          body: { targetConversationId },
          user: { id: userId, username: socket.username },
          io: io, // Très important : on donne accès à io
        };

        const fakeRes = {
          json: (obj) => {
            // Si succès → on émet directement le nouveau message transféré
            if (obj.success) {
              console.log(
                "Message transféré avec succès → diffusion en temps réel"
              );

              // On émet le message dans la conversation cible
              io.to(targetConversationId.toString()).emit("new_message", {
                message: obj.forwardedMessage,
                forwarded: true,
                originalMessageId: messageId,
              });

              // On notifie aussi l'émetteur que tout s'est bien passé
              socket.emit("forward_success", {
                success: true,
                message: "Message transféré !",
                forwardedMessage: obj.forwardedMessage,
                targetConversationId,
              });
            } else {
              throw new Error(obj.error || "Échec du transfert");
            }
          },
          status: (code) => ({
            json: (obj) => {
              socket.emit("forward_error", {
                success: false,
                error: obj.error || "Erreur lors du transfert",
                statusCode: code,
              });
            },
          }),
        };

        // Appelle directement la méthode du controller (elle gère tout : chiffrement, sauvegarde, socket, etc.)
        await messageController.forwardMessage(fakeReq, fakeRes);
      } catch (error) {
        console.error("Erreur transfert de message (socket):", error.message);
        socket.emit("forward_error", {
          success: false,
          error: error.message || "Impossible de transférer le message",
        });
      }
    });
    // ==================== 🗃️ ARCHIVAGE DES CONVERSATIONS EN TEMPS RÉEL ====================

    socket.on("archive_conversation", async (data) => {
      try {
        const { conversationId } = data;
        const userId = socket.userId;

        console.log("🗃️ Archivage conversation via socket:", {
          conversationId,
          userId,
        });

        if (!conversationId) {
          throw new Error("ID conversation requis");
        }

        // Vérifier que l'utilisateur a accès à la conversation
        const hasAccess = await Participants.findOne({
          Id_Conversation: conversationId,
          Id_User: userId,
        });

        if (!hasAccess) {
          throw new Error("Vous n'êtes pas membre de cette conversation");
        }

        // Simuler une requête pour le controller d'archivage
        const fakeReq = {
          params: { conversationId },
          user: { _id: userId },
        };

        const fakeRes = {
          json: (obj) => {
            if (obj.success) {
              // Notifier l'utilisateur que l'archivage a réussi
              socket.emit("conversation_archived", {
                success: true,
                conversationId: conversationId,
                archivedAt: new Date(),
              });

              // Notifier tous les clients de cet utilisateur pour mettre à jour l'interface
              io.to(`user_${userId}`).emit("conversation_archived_update", {
                type: "archived",
                conversationId: conversationId,
                timestamp: new Date(),
              });

              console.log(
                `✅ Conversation ${conversationId} archivée par ${userId}`
              );
            } else {
              throw new Error(obj.error || "Échec de l'archivage");
            }
          },
          status: (code) => ({
            json: (obj) => {
              socket.emit("archive_error", {
                success: false,
                error: obj.error || "Erreur lors de l'archivage",
                statusCode: code,
              });
            },
          }),
        };

        // Utiliser le controller d'archivage (vous devrez l'importer)
        const { archiveController } = await import(
          "../controllers/archiveController.js"
        );
        await archiveController.archiveConversation(userId, conversationId);

        // Émettre les événements de succès
        socket.emit("conversation_archived", {
          success: true,
          conversationId: conversationId,
          archivedAt: new Date(),
        });

        io.to(`user_${userId}`).emit("conversation_archived_update", {
          type: "archived",
          conversationId: conversationId,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("💥 Erreur archivage socket:", error);
        socket.emit("archive_error", {
          success: false,
          error: error.message,
        });
      }
    });

    socket.on("unarchive_conversation", async (data) => {
      try {
        const { conversationId } = data;
        const userId = socket.userId;

        console.log("🗃️ Désarchivage conversation via socket:", {
          conversationId,
          userId,
        });

        if (!conversationId) {
          throw new Error("ID conversation requis");
        }

        // Utiliser le controller d'archivage
        const { archiveController } = await import(
          "../controllers/archiveController.js"
        );
        await archiveController.unarchiveConversation(userId, conversationId);

        // Notifier l'utilisateur que le désarchivage a réussi
        socket.emit("conversation_unarchived", {
          success: true,
          conversationId: conversationId,
        });

        // Notifier tous les clients de cet utilisateur pour mettre à jour l'interface
        io.to(`user_${userId}`).emit("conversation_archived_update", {
          type: "unarchived",
          conversationId: conversationId,
          timestamp: new Date(),
        });

        console.log(
          `✅ Conversation ${conversationId} désarchivée par ${userId}`
        );
      } catch (error) {
        console.error("💥 Erreur désarchivage socket:", error);
        socket.emit("archive_error", {
          success: false,
          error: error.message,
        });
      }
    });

    socket.on("get_archived_conversations", async () => {
      try {
        const userId = socket.userId;

        console.log(
          "🗃️ Récupération conversations archivées via socket:",
          userId
        );

        const { archiveController } = await import(
          "../controllers/archiveController.js"
        );
        const archivedConversations =
          await archiveController.getArchivedConversations(userId);

        socket.emit("archived_conversations_data", {
          success: true,
          conversations: archivedConversations,
          count: archivedConversations.length,
        });

        console.log(
          `✅ ${archivedConversations.length} conversations archivées envoyées`
        );
      } catch (error) {
        console.error("💥 Erreur récupération archivées socket:", error);
        socket.emit("archive_error", {
          success: false,
          error: error.message,
        });
      }
    });

    socket.on("get_archived_count", async () => {
      try {
        const userId = socket.userId;

        const { archiveController } = await import(
          "../controllers/archiveController.js"
        );
        const archivedCount = await archiveController.getArchivedCount(userId);

        socket.emit("archived_count_data", {
          success: true,
          archivedCount: archivedCount,
        });
      } catch (error) {
        socket.emit("archive_error", {
          success: false,
          error: error.message,
        });
      }
    });

    // ==================== 📞 ÉVÉNEMENTS D'APPEL (MANQUÉ ET TERMINÉ) AVEC SAUVEGARDE BDD ====================

    // Événement quand un appel est refusé ou manqué
    socket.on("call-missed", async (data) => {
      try {
        const { conversationId, callType, reason = 'missed', startTime } = data;
        const callerId = socket.userId;

        if (!conversationId || !callType) {
          socket.emit("call-message-error", { error: "Données d'appel incomplètes" });
          return;
        }

        console.log(`📞 Appel ${callType} manqué (${reason}) - Création message`);

        // 🆕 SAUVEGARDER L'APPEL MANQUÉ DANS LA BDD
        const receiverId = await findReceiverId(conversationId, callerId);
        if (receiverId) {
          await saveCallToDB({
            conversationId,
            callerId,
            receiverId,
            callType,
            status: reason,
            duration: 0,
            startTime
          });
        }

        // Créer un message d'appel manqué
        const result = await messageController.createCallMessage(
          {
            conversationId,
            callerId,
            callType,
            status: "missed",
          },
          io
        );

        if (result) {
          socket.emit("call-message-sent", {
            success: true,
            message: result,
          });
        }
      } catch (error) {
        console.error("❌ Erreur création message appel manqué:", error.message);
        socket.emit("call-message-error", { error: error.message });
      }
    });

    // Événement quand un appel se termine (après acceptation)
    socket.on("call-ended", async (data) => {
      try {
        const { conversationId, callType, duration, initiatorId, startTime } = data;
        // Utiliser initiatorId s'il est fourni, sinon utiliser socket.userId
        const callerId = initiatorId || socket.userId;

        if (!conversationId || !callType || duration === undefined) {
          socket.emit("call-message-error", { error: "Données d'appel incomplètes" });
          return;
        }

        console.log(`📞 Appel ${callType} terminé - Durée: ${duration}s - Création message par: ${callerId}`);

        // 🆕 SAUVEGARDER L'APPEL TERMINÉ DANS LA BDD
        const receiverId = await findReceiverId(conversationId, callerId);
        if (receiverId) {
          await saveCallToDB({
            conversationId,
            callerId,
            receiverId,
            callType,
            status: 'completed',
            duration,
            startTime
          });
        }

        // Créer un message d'appel terminé avec la durée
        const result = await messageController.createCallMessage(
          {
            conversationId,
            callerId,
            callType,
            status: "completed",
            duration,
          },
          io
        );

        if (result) {
          socket.emit("call-message-sent", {
            success: true,
            message: result,
          });
        }
      } catch (error) {
        console.error("❌ Erreur création message appel terminé:", error.message);
        socket.emit("call-message-error", { error: error.message });
      }
    });

    // ==================== VOTRE CODE EXISTANT ====================

    // 🆕 JOIN NOTIFICATIONS AVEC USERID DU TOKEN
    socket.on("join_notifications", async () => {
      try {
        const userId = socket.userId;

        socket.join(`user_${userId}`);

        // 🆕 METTRE À JOUR LA PRÉSENCE AVANCÉE
        await updateUserPresence(userId, socket.id, "online");

        console.log(
          `🔔 User ${userId} a rejoint ses notifications (présence: online)`
        );

        // 🆕 NOTIFIER LES CONTACTS DE LA PRÉSENCE
        notifyUserPresence(io, userId, "online");

        // 🆕 DÉMARRER LE HEARTBEAT
        presenceInterval = startPresenceHeartbeat(userId, socket.id);
      } catch (error) {
        socket.emit("notification_error", { message: error.message });
      }
    });

    // Événements existants
    socket.on("join_conversation", (conversationId) => {
      try {
        if (!conversationId || typeof conversationId !== "string") {
          throw new Error("ID de conversation invalide");
        }
        socket.join(conversationId);
        console.log(`📱 User ${socket.userId} a rejoint: ${conversationId}`);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
      console.log(`📱 User ${socket.userId} a quitté: ${conversationId}`);
    });

    socket.on("user_typing", async (data) => {
      try {
        const { conversationId, isTyping } = data;

        if (!conversationId) {
          throw new Error("ID conversation requis");
        }

        console.log(
          `⌨️ User ${socket.username} ${
            isTyping ? "typing..." : "stopped typing"
          } in ${conversationId}`
        );

        socket.to(conversationId).emit("user_typing", {
          userId: socket.userId,
          isTyping: isTyping,
          conversationId: conversationId,
          userName: socket.username,
          timestamp: new Date(),
        });

        // METTRE À JOUR L'ACTIVITÉ
        await updateUserActivity(socket.userId, socket.id);
      } catch (error) {
        console.error("💥 Erreur typing indicator:", error.message);
        socket.emit("error", { message: "Erreur typing indicator" });
      }
    });

    socket.on("get_conversation_history", async (data) => {
      try {
        console.log("📜 Demande historique:", data);
        const { conversationId } = data;

        const messages = await messageController.getConversationMessages(
          conversationId
        );

        socket.emit("conversation_history", {
          success: true,
          messages: messages,
          conversationId: conversationId,
        });

        console.log(`📜 Historique envoyé: ${messages.length} messages`);
      } catch (error) {
        console.error("💥 Erreur historique:", error.message);
        socket.emit("conversation_history", {
          success: false,
          error: error.message,
        });
      }
    });

    // 🆕 ÉVÉNEMENT ENVOI MESSAGE SÉCURISÉ - CORRIGÉ SANS DOUBLON
    socket.on("send_message", async (data) => {
      console.log("📨 Message reçu:", data);

      try {
        let messageData = data;

        if (typeof data === "string") {
          messageData = JSON.parse(data);
        }

        const requiredFields = ["content"];
        const missingFields = requiredFields.filter(
          (field) => !messageData[field]
        );

        if (missingFields.length > 0) {
          throw new Error(`Champs manquants: ${missingFields.join(", ")}`);
        }

        // Vérification autorisation si conversationId fourni
        if (messageData.conversationId) {
          await conversationController.checkUserAuthorization(
            socket.userId,
            messageData.conversationId
          );
        }

        const finalMessageData = {
          ...messageData,
          Id_sender: socket.userId, // ← SÉCURISÉ DU TOKEN
        };

        // SAUVEGARDE DU MESSAGE (l'émission se fait dans handleMessageCreation)
        const savedMessage = await messageController.createMessage(
          finalMessageData,
          io,
          socket.userId
        );

        // METTRE À JOUR L'ACTIVITÉ
        await updateUserActivity(socket.userId, socket.id);

        // ✅ SEULEMENT CONFIRMATION À L'ÉMETTEUR - PAS D'ÉMISSION VERS LES AUTRES
        socket.emit("message_sent", {
          success: true,
          data: savedMessage,
          timestamp: new Date(),
        });

        console.log("🎉 Message traité - ID:", savedMessage._id);
      } catch (error) {
        console.error("💥 Erreur traitement message:", error.message);

        socket.emit("message_error", {
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      }
    });

    // 🆕 ÉVÉNEMENT ENVOI IMAGE - CORRIGÉ SANS DOUBLON
    socket.on("send_image_message", async (data) => {
      console.log("🖼️ Image message reçu:", data);

      try {
        // Vérification autorisation
        if (data.conversationId) {
          await conversationController.checkUserAuthorization(
            socket.userId,
            data.conversationId
          );
        }

        const messageData = {
          conversationId: data.conversationId,
          Id_receiver: data.Id_receiver,
          typeMessage: "image",
        };

        // Traitement du fichier image
        let fileBuffer;
        if (
          typeof data.file === "string" &&
          data.file.startsWith("data:image")
        ) {
          const base64Data = data.file.split(",")[1];
          fileBuffer = Buffer.from(base64Data, "base64");
        } else if (data.fileBuffer) {
          fileBuffer = Buffer.from(data.fileBuffer);
        } else {
          throw new Error("Format de fichier image non reconnu");
        }

        // Création objet fichier
        const file = {
          buffer: fileBuffer,
          originalname: data.fileName || "image",
          mimetype: data.fileType || "image/jpeg",
        };

        // 🆕 L'émission se fait dans uploadImageMessage via handleMessageCreation
        const savedMessage = await messageController.uploadImageMessage(
          file,
          messageData,
          io,
          socket.userId
        );

        // METTRE À JOUR L'ACTIVITÉ
        await updateUserActivity(socket.userId, socket.id);

        // ✅ SEULEMENT CONFIRMATION À L'ÉMETTEUR - PAS D'ÉMISSION VERS LES AUTRES
        socket.emit("image_message_sent", {
          success: true,
          data: savedMessage,
          timestamp: new Date(),
        });

        console.log("🖼️ Message image traité - ID:", savedMessage._id);
      } catch (error) {
        console.error("💥 Erreur traitement image message:", error.message);
        socket.emit("image_message_error", {
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      }
    });

    // 🆕 ÉVÉNEMENT ENVOI FICHIER - CORRIGÉ SANS DOUBLON
    socket.on("send_file_message", async (data) => {
      console.log("📎 File message reçu:", data);

      try {
        // Vérification autorisation
        if (data.conversationId) {
          await conversationController.checkUserAuthorization(
            socket.userId,
            data.conversationId
          );
        }

        const messageData = {
          conversationId: data.conversationId,
          Id_receiver: data.Id_receiver,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          originalName: data.originalName,
          typeMessage: "file",
        };

        // Traitement du fichier
        let fileBuffer;
        if (typeof data.file === "string" && data.file.startsWith("data:")) {
          const base64Data = data.file.split(",")[1];
          fileBuffer = Buffer.from(base64Data, "base64");
        } else if (data.fileBuffer) {
          fileBuffer = Buffer.from(data.fileBuffer);
        } else {
          throw new Error("Format de fichier non reconnu");
        }

        // Création objet fichier
        const file = {
          buffer: fileBuffer,
          originalname: data.fileName || data.originalName || "file",
          mimetype: data.fileType || "application/octet-stream",
          size: data.fileSize,
        };

        // 🆕 L'émission se fait dans uploadFileMessage via handleMessageCreation
        const savedMessage = await messageController.uploadFileMessage(
          file,
          messageData,
          io,
          socket.userId
        );

        // METTRE À JOUR L'ACTIVITÉ
        await updateUserActivity(socket.userId, socket.id);

        // Formater le message pour l'interface
        const formattedMessage = {
          _id: savedMessage._id,
          conversationId: savedMessage.conversationId,
          Id_sender: savedMessage.Id_sender,
          Id_receiver: data.Id_receiver,
          typeMessage: savedMessage.typeMessage || "file",
          content: savedMessage.content,
          fileUrl: savedMessage.fileUrl,
          fileName: savedMessage.fileName || data.fileName,
          fileSize: savedMessage.fileSize || data.fileSize,
          fileType: savedMessage.fileType || data.fileType,
          originalName: savedMessage.originalName || data.originalName,
          status: savedMessage.status,
          time: savedMessage.time || savedMessage.timestamp,
          timestamp: new Date(),
        };

        // ✅ SEULEMENT CONFIRMATION À L'ÉMETTEUR - PAS D'ÉMISSION VERS LES AUTRES
        socket.emit("file_message_sent", {
          success: true,
          data: formattedMessage,
          timestamp: new Date(),
        });

        console.log("📎 Message fichier traité - ID:", savedMessage._id);
      } catch (error) {
        console.error("💥 Erreur traitement fichier message:", error.message);
        socket.emit("file_message_error", {
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      }
    });

    // 🆕 ÉVÉNEMENT ENVOI VIDÉO - CORRIGÉ SANS DOUBLON
    socket.on("send_video_message", async (data) => {
      console.log("🎥 Video message reçu:", data);

      try {
        if (!data.file) {
          throw new Error("Aucun fichier vidéo reçu");
        }

        // Vérification autorisation
        if (data.conversationId) {
          await conversationController.checkUserAuthorization(
            socket.userId,
            data.conversationId
          );
        }

        const messageData = {
          conversationId: data.conversationId,
          Id_receiver: data.Id_receiver,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          typeMessage: "video",
        };

        // Conversion ArrayBuffer → Buffer Node.js
        const fileBuffer = Buffer.from(new Uint8Array(data.file));

        // Création objet fichier
        const file = {
          buffer: fileBuffer,
          originalname: data.fileName || "video",
          mimetype: data.fileType || "video/mp4",
          size: data.fileSize,
        };

        // 🆕 L'émission se fait dans uploadVideoMessage via handleMessageCreation
        const savedMessage = await messageController.uploadVideoMessage(
          file,
          messageData,
          io,
          socket.userId
        );

        // METTRE À JOUR L'ACTIVITÉ
        await updateUserActivity(socket.userId, socket.id);

        // Formater le message pour l'interface
        const formattedMessage = {
          _id: savedMessage._id,
          conversationId: savedMessage.conversationId,
          Id_sender: savedMessage.Id_sender,
          Id_receiver: data.Id_receiver,
          typeMessage: savedMessage.typeMessage || "video",
          content: savedMessage.content,
          fileUrl: savedMessage.fileUrl,
          fileName: savedMessage.fileName || data.fileName,
          fileSize: savedMessage.fileSize || data.fileSize,
          fileType: savedMessage.fileType || data.fileType,
          status: savedMessage.status,
          time: savedMessage.time || savedMessage.timestamp,
          timestamp: new Date(),
        };

        // ✅ SEULEMENT CONFIRMATION À L'ÉMETTEUR - PAS D'ÉMISSION VERS LES AUTRES
        socket.emit("video_message_sent", {
          success: true,
          data: formattedMessage,
          timestamp: new Date(),
        });

        console.log("🎥 Message vidéo traité - ID:", savedMessage._id);
      } catch (error) {
        console.error("💥 Erreur traitement vidéo message:", error.message);
        socket.emit("video_message_error", {
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      }
    });

    // ÉVÉNEMENTS COMPTEURS
    socket.on("get_unread_counts", async () => {
      try {
        const userId = socket.userId;

        const conversations = await Participants.find({
          Id_User: userId,
        }).populate({
          path: "Id_Conversation",
          match: { "unreadCounts.count": { $gt: 0 } },
        });

        const unreadData = conversations
          .filter((p) => p.Id_Conversation)
          .map((p) => ({
            conversationId: p.Id_Conversation._id,
            unreadCount:
              p.Id_Conversation.unreadCounts.find(
                (u) => u.userId.toString() === userId
              )?.count || 0,
          }));

        const totalUnread = unreadData.reduce(
          (sum, item) => sum + item.unreadCount,
          0
        );

        socket.emit("unread_counts_data", {
          success: true,
          totalUnread: totalUnread,
          conversationCounts: unreadData,
        });
      } catch (error) {
        socket.emit("notification_error", { message: error.message });
      }
    });

    socket.on("mark_conversation_read", async (data) => {
      try {
        const { conversationId } = data;
        const userId = socket.userId;

        await Conversation.findOneAndUpdate(
          { _id: conversationId, "unreadCounts.userId": userId },
          { $set: { "unreadCounts.$.count": 0 } }
        );

        socket.emit("conversation_marked_read", {
          success: true,
          conversationId: conversationId,
        });
      } catch (error) {
        socket.emit("notification_error", { message: error.message });
      }
    });

    // ÉVÉNEMENT HEARTBEAT PRÉSENCE
    socket.on("user_heartbeat", async () => {
      const userId = socket.userId;
      await updateUserActivity(userId, socket.id);

      userPresence.set(userId, {
        ...userPresence.get(userId),
        lastSeen: new Date(),
        status: "online",
      });
    });

    // ÉVÉNEMENT CHANGEMENT STATUT
    socket.on("user_status_change", async (data) => {
      if (data.status) {
        await updateUserStatus(socket.userId, data.status);
        notifyUserPresence(io, socket.userId, data.status);
      }
    });

    // Événements existants
    socket.on("ping", () => {
      socket.emit("pong", {
        message: "Serveur actif ✅",
        timestamp: new Date(),
      });
    });

    socket.on("mark_as_read", async (data) => {
      try {
        console.log("👀 Message marqué comme lu:", data);
        socket.emit("message_read", {
          success: true,
          messageId: data.messageId,
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // 🆕 DÉCONNEXION ROBUSTE
    socket.on("disconnect", async (reason) => {
      console.log("🔴 User déconnecté:", socket.userId, "- Raison:", reason);

      // NETTOYAGE INTERVAL
      if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
      }

      // GARANTIR LA DÉCONNEXION
      if (socket.userId) {
        await removeUserSession(socket.userId, socket.id);

        const remainingSessions = await getRemainingSessions(socket.userId);

        if (remainingSessions === 0) {
          await updateUserStatus(socket.userId, "offline");
          notifyUserPresence(io, socket.userId, "offline");
          console.log(
            `🔔 User ${socket.userId} est maintenant offline (0 sessions)`
          );
        } else {
          console.log(
            `🔔 User ${socket.userId} a ${remainingSessions} sessions restantes`
          );
        }

        // NETTOYAGE MÉMOIRE
        userPresence.delete(socket.userId);
      }
    });

    socket.on("error", (error) => {
      console.error("💥 Erreur socket:", error);
    });
  });

  // FONCTIONS HELPER PRÉSENCE AVANCÉE

  async function updateUserPresence(userId, socketId, status = "online") {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            status: status,
            lastSeen: new Date(),
          },
          $push: {
            activeSessions: {
              socketId: socketId,
              deviceType: "web",
              connectedAt: new Date(),
              lastActivity: new Date(),
            },
          },
        },
        { new: true }
      );

      userPresence.set(userId, {
        socketId: socketId,
        lastSeen: new Date(),
        status: status,
        sessions: user?.activeSessions || [],
      });

      console.log(`✅ Présence mise à jour: ${userId} - ${status}`);
      return user;
    } catch (error) {
      console.error("❌ Erreur mise à jour présence:", error);
    }
  }

  async function updateUserActivity(userId, socketId) {
    try {
      await User.updateOne(
        {
          _id: userId,
          "activeSessions.socketId": socketId,
        },
        {
          $set: {
            "activeSessions.$.lastActivity": new Date(),
            lastSeen: new Date(),
          },
        }
      );
    } catch (error) {
      console.error("❌ Erreur mise à jour activité:", error);
    }
  }

  async function updateUserStatus(userId, status) {
    try {
      await User.findByIdAndUpdate(userId, {
        status: status,
        lastSeen: new Date(),
      });

      if (userPresence.has(userId)) {
        userPresence.set(userId, {
          ...userPresence.get(userId),
          status: status,
          lastSeen: new Date(),
        });
      }
    } catch (error) {
      console.error("❌ Erreur mise à jour statut:", error);
    }
  }

  // FONCTION CORRIGÉE POUR SUPPRIMER LES SESSIONS
  async function removeUserSession(userId, socketId) {
    try {
      console.log(`🗑️  Suppression session: ${socketId} pour user: ${userId}`);

      // Supprimer de la BDD
      await User.findByIdAndUpdate(userId, {
        $pull: {
          activeSessions: { socketId: socketId },
        },
      });

      // Mettre à jour la présence en mémoire
      if (userPresence.has(userId)) {
        const presence = userPresence.get(userId);

        if (presence.sessions) {
          const beforeCount = presence.sessions.length;
          presence.sessions = presence.sessions.filter(
            (s) => s.socketId !== socketId
          );
          const afterCount = presence.sessions.length;

          console.log(`🔢 Sessions ${userId}: ${beforeCount} → ${afterCount}`);

          if (afterCount === 0) {
            presence.status = "offline";
            console.log(`🔔 User ${userId} marqué comme offline (0 sessions)`);
          }
        }
      }
    } catch (error) {
      console.error("❌ Erreur suppression session:", error);
    }
  }

  async function getRemainingSessions(userId) {
    try {
      const user = await User.findById(userId);
      return user?.activeSessions?.length || 0;
    } catch (error) {
      console.error("❌ Erreur comptage sessions:", error);
      return 0;
    }
  }

  function startPresenceHeartbeat(userId, socketId) {
    return setInterval(async () => {
      if (userPresence.has(userId)) {
        await updateUserActivity(userId, socketId);
      }
    }, 30000); // 30 secondes
  }

  function notifyUserPresence(io, userId, status) {
    io.emit("user_presence_changed", {
      userId: userId,
      status: status,
      lastSeen: new Date(),
    });
  }
};