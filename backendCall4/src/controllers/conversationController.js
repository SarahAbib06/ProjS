import Conversation from "../models/Conversation.js";
import Participants from "../models/Participants.js";
import User from "../models/User.js";
import mongoose from "mongoose";

export const conversationController = {
  getOrCreateConversation: async (Id_sender, Id_receiver) => {
    // 🎯 VÉRIFICATION IDs FORMAT
    if (
      !mongoose.Types.ObjectId.isValid(Id_sender) ||
      !mongoose.Types.ObjectId.isValid(Id_receiver)
    ) {
      throw new Error("IDs utilisateurs invalides");
    }

    // 🎯 VÉRIFICATION SI LES USERS EXISTENT
    const [senderExists, receiverExists] = await Promise.all([
      User.findById(Id_sender),
      User.findById(Id_receiver),
    ]);

    if (!senderExists) {
      throw new Error(`L'utilisateur expéditeur (${Id_sender}) n'existe pas`);
    }
    if (!receiverExists) {
      throw new Error(
        `L'utilisateur destinataire (${Id_receiver}) n'existe pas`
      );
    }

    // 🎯 EMPÊCHER CONVERSATION AVEC SOI-MÊME
    if (Id_sender.toString() === Id_receiver.toString()) {
      throw new Error("Impossible de créer une conversation avec vous-même");
    }

    const existingConversation = await Conversation.findOne({
      Id_participant: { $all: [Id_sender, Id_receiver] },
      type: "private",
    });

    if (existingConversation) {
      console.log("✅ Conversation existante:", existingConversation._id);
      return existingConversation;
    }

    const newConversation = await Conversation.create({
      Id_participant: [Id_sender, Id_receiver],
      type: "private",
      createdBy: Id_sender,
    });

    console.log("✅ Nouvelle conversation:", newConversation._id);

    // 🆕 CRÉATION DES PARTICIPANTS AVEC VÉRIFICATION
    try {
      await Participants.create([
        {
          Id_User: Id_sender,
          Id_Conversation: newConversation._id,
          Role: "membre",
        },
        {
          Id_User: Id_receiver,
          Id_Conversation: newConversation._id,
          Role: "membre",
        },
      ]);
      console.log("✅ Participants créés avec succès");
    } catch (error) {
      // 🆕 SI ERREUR, SUPPRIMER LA CONVERSATION CRÉÉE
      await Conversation.findByIdAndDelete(newConversation._id);
      throw new Error("Erreur création participants: " + error.message);
    }

    return newConversation;
  },

  // 🆕 FONCTION POUR CRÉER UN GROUPE (SÉCURISÉE)
  createGroupConversation: async (
    creatorIdFromToken,
    participantIds,
    groupName
  ) => {
    // 🎯 VÉRIFICATIONS
    if (!mongoose.Types.ObjectId.isValid(creatorIdFromToken)) {
      throw new Error("ID créateur invalide");
    }

    if (!participantIds || participantIds.length < 2) {
      throw new Error("Un groupe doit avoir au moins 2 autres participants");
    }

    if (!groupName || groupName.trim().length === 0) {
      throw new Error("Le nom du groupe est requis");
    }

    // 🎯 VÉRIFIER QUE TOUS LES USERS EXISTENT
    const allUserIds = [creatorIdFromToken, ...participantIds];
    const users = await User.find({ _id: { $in: allUserIds } });

    if (users.length !== allUserIds.length) {
      throw new Error("Certains utilisateurs n'existent pas");
    }

    // 🎯 CRÉER LA CONVERSATION DE GROUPE
    const newConversation = await Conversation.create({
      Id_participant: allUserIds,
      type: "group",
      groupName: groupName.trim(),
      createdBy: creatorIdFromToken,
    });

    console.log(
      `✅ Groupe créé: ${groupName} (${allUserIds.length} participants)`
    );

    // 🎯 CRÉER LES PARTICIPANTS
    try {
      const participantsData = allUserIds.map((userId) => ({
        Id_User: userId,
        Id_Conversation: newConversation._id,
        Role: userId === creatorIdFromToken ? "admin" : "membre",
      }));

      await Participants.insertMany(participantsData);
      console.log(
        `✅ ${participantsData.length} participants ajoutés au groupe`
      );
    } catch (error) {
      // 🆕 SI ERREUR, SUPPRIMER LA CONVERSATION
      await Conversation.findByIdAndDelete(newConversation._id);
      throw new Error("Erreur création participants groupe: " + error.message);
    }

    return newConversation;
  },

  // 🎯 VÉRIFICATION AUTORISATION CONVERSATION
  checkUserAuthorization: async (userId, conversationId) => {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(conversationId)
    ) {
      throw new Error("IDs invalides");
    }

    // 🆕 VÉRIFIER QUE L'USER EXISTE
    const userExists = await User.findById(userId);
    if (!userExists) {
      throw new Error("Utilisateur non trouvé");
    }

    const participant = await Participants.findOne({
      Id_User: userId,
      Id_Conversation: conversationId,
    });

    if (!participant) {
      throw new Error(
        "Non autorisé à envoyer des messages dans cette conversation"
      );
    }

    return true;
  },

  // 🆕 FONCTION POUR RÉCUPÉRER LES GROUPES D'UN USER
  getUserGroups: async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("ID utilisateur invalide");
    }

    const userGroups = await Participants.find({
      Id_User: userId,
    })
      .populate({
        path: "Id_Conversation",
        match: { type: "group" },
      })
      .populate("Id_User", "username profilePicture");

    const groups = userGroups
      .filter((p) => p.Id_Conversation) // Filtrer les conversations de groupe
      .map((p) => ({
        _id: p.Id_Conversation._id,
        name: p.Id_Conversation.groupName,
        type: p.Id_Conversation.type,
        unreadCount:
          p.Id_Conversation.unreadCounts?.find(
            (u) => u.userId && u.userId.toString() === userId
          )?.count || 0,
        lastMessageAt: p.Id_Conversation.lastMessageAt,
        participantCount: p.Id_Conversation.Id_participant?.length || 0,
        role: p.Role,
      }));

    return groups;
  },
};
