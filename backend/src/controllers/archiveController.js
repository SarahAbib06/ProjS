// controllers/archiveController.js
import Conversation from "../models/Conversation.js";
import Participants from "../models/Participants.js";
import User from "../models/User.js";
import mongoose from "mongoose";

export const archiveController = {
  // 🆕 ARCHIVER UNE CONVERSATION
  archiveConversation: async (userId, conversationId) => {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(conversationId)
    ) {
      throw new Error("IDs invalides");
    }

    // Vérifier que l'utilisateur a accès à la conversation
    const participant = await Participants.findOne({
      Id_User: userId,
      Id_Conversation: conversationId,
    });

    if (!participant) {
      throw new Error("Conversation non trouvée ou accès refusé");
    }

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: {
          archivedBy: {
            userId: userId,
            archivedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!conversation) {
      throw new Error("Conversation non trouvée");
    }

    return conversation;
  },

  // 🆕 DÉSARCHIVER UNE CONVERSATION
  unarchiveConversation: async (userId, conversationId) => {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(conversationId)
    ) {
      throw new Error("IDs invalides");
    }

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $pull: {
          archivedBy: { userId: userId },
        },
      },
      { new: true }
    );

    if (!conversation) {
      throw new Error("Conversation non trouvée");
    }

    return conversation;
  },

  // 🆕 RÉCUPÉRER LES CONVERSATIONS ARCHIVÉES
  getArchivedConversations: async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("ID utilisateur invalide");
    }

    const userParticipants = await Participants.find({
      Id_User: userId,
    })
      .populate({
        path: "Id_Conversation",
        match: {
          "archivedBy.userId": userId,
        },
      })
      .populate("Id_User", "username profilePicture");

    const archivedConversations = userParticipants
      .filter((p) => p.Id_Conversation !== null)
      .map((participant) => {
        const conv = participant.Id_Conversation;

        // Récupérer tous les participants pour les conversations privées
        let conversationName = null;
        if (conv.type === "private") {
          const otherParticipant = userParticipants.find(
            (p) =>
              p.Id_Conversation?._id?.toString() === conv._id.toString() &&
              p.Id_User._id.toString() !== userId.toString()
          );
          conversationName =
            otherParticipant?.Id_User?.username || "Utilisateur";
        } else {
          conversationName = conv.groupName;
        }

        // Trouver la date d'archivage
        const archiveInfo = conv.archivedBy.find(
          (a) => a.userId.toString() === userId.toString()
        );

        return {
          _id: conv._id,
          type: conv.type,
          name: conversationName,
          unreadCount:
            conv.unreadCounts?.find(
              (u) => u.userId && u.userId.toString() === userId
            )?.count || 0,
          lastMessageAt: conv.lastMessageAt,
          archivedAt: archiveInfo?.archivedAt,
          participantCount: conv.Id_participant?.length || 0,
          role: participant.Role,
          participants: [participant.Id_User], // Garder la cohérence avec votre structure existante
        };
      });

    // Trier par date d'archivage (les plus récentes en premier)
    return archivedConversations.sort(
      (a, b) => new Date(b.archivedAt) - new Date(a.archivedAt)
    );
  },

  // 🆕 VÉRIFIER SI UNE CONVERSATION EST ARCHIVÉE
  isConversationArchived: async (userId, conversationId) => {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(conversationId)
    ) {
      return false;
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      "archivedBy.userId": userId,
    });

    return !!conversation;
  },

  // 🆕 RÉCUPÉRER LE NOMBRE DE CONVERSATIONS ARCHIVÉES
  getArchivedCount: async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("ID utilisateur invalide");
    }

    const userParticipants = await Participants.find({
      Id_User: userId,
    }).populate({
      path: "Id_Conversation",
      match: {
        "archivedBy.userId": userId,
      },
    });

    return userParticipants.filter((p) => p.Id_Conversation !== null).length;
  },
};
