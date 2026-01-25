// src/controllers/reactionController.js
import Reaction from "../models/Reaction.js";
import Message from "../models/Message.js";

// Fonction pour émettre les réactions via Socket.io
const emitReactionUpdate = (io, messageId, action, reactionData = null) => {
  io.to(`message_${messageId}`).emit("reaction_updated", {
    messageId,
    action, // 'added' ou 'removed'
    reaction: reactionData,
    timestamp: new Date(),
  });

  console.log(`🔔 Réaction ${action} diffusée pour le message: ${messageId}`);
};

// Ajouter une réaction
export const addReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;

    // 🆕 CORRECTION: Utiliser req.user au lieu de req.userId
    const userId = req.user?.userId || req.user?.id;

    console.log("🐛 DEBUG: Début de addReaction");
    console.log("🔑 req.user:", req.user);
    console.log("🔑 userId extrait:", userId);
    console.log("📦 Données reçues:", { messageId, emoji, userId });

    // 🆕 VÉRIFICATION USER ID
    if (!userId) {
      return res.status(401).json({
        error: "User ID manquant - Authentification requise",
        debug: {
          userObject: req.user,
          headers: req.headers,
        },
      });
    }

    // Vérifier si le message existe
    const message = await Message.findById(messageId);
    if (!message) {
      console.log("❌ Message non trouvé");
      return res.status(404).json({ error: "Message non trouvé" });
    }

    // Vérifier s'il y a déjà une réaction
    console.log("🔍 Recherche des réactions existantes...");

    const existingReaction = await Reaction.findOne({
      Id_message: messageId,
      id_user: userId,
    });

    console.log("🔍 Réaction existante trouvée:", existingReaction);

    if (existingReaction) {
      console.log(
        "❌ BLOQUÉ: Réaction existe déjà pour user",
        userId,
        "sur message",
        messageId
      );
      return res.status(400).json({
        error: "Vous avez déjà réagi à ce message",
      });
    }

    console.log("✅ OK: Aucune réaction existante, création...");

    // Créer la réaction
    const reaction = new Reaction({
      Id_message: messageId,
      id_user: userId,
      emoji,
    });

    await reaction.save();
    
    // 🆕 AJOUT : METTRE À JOUR LE MESSAGE AVEC LA RÉACTION
    await Message.findByIdAndUpdate(messageId, {
      $push: { reactions: reaction._id }
    });
    
    await reaction.populate("id_user", "username avatar");

    // 🆕 DIFFUSION TEMPS RÉEL
    const io = req.app.get("io");
    if (io) {
      emitReactionUpdate(io, messageId, "added", reaction);

      // 🆕 Diffuser également dans la conversation
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

    console.log("🎉 SUCCÈS: Réaction créée avec ID:", reaction._id);

    res.status(201).json({
      success: true,
      data: reaction,
    });
  } catch (error) {
    console.log("💥 ERREUR DÉTAILLÉE:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });

    if (error.code === 11000) {
      return res.status(400).json({
        error: "Vous avez déjà réagi à ce message (erreur index unique)",
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Supprimer une réaction
export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;

    // 🆕 CORRECTION: Utiliser req.user au lieu de req.userId
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentification requise" });
    }

    const reaction = await Reaction.findOneAndDelete({
      Id_message: messageId,
      id_user: userId,
    });

    if (!reaction) {
      return res.status(404).json({ error: "Réaction non trouvée" });
    }

    // 🆕 AJOUT : RETIRER LA RÉACTION DU MESSAGE
    await Message.findByIdAndUpdate(messageId, {
      $pull: { reactions: reaction._id }
    });

    // 🆕 DIFFUSION TEMPS RÉEL
    const io = req.app.get("io");
    if (io) {
      emitReactionUpdate(io, messageId, "removed", reaction);

      // 🆕 Récupérer le message pour avoir l'ID de conversation
      const message = await Message.findById(messageId);
      if (message) {
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
    }

    res.json({
      message: "Réaction supprimée",
      data: reaction,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtenir les réactions d'un message
export const getMessageReactions = async (req, res) => {
  try {
    const { messageId } = req.params;

    const reactions = await Reaction.find({ Id_message: messageId })
      .populate("id_user", "username avatar")
      .sort({ time: -1 });

    res.json(reactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};