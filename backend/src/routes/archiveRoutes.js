// routes/archiveRoutes.js
import express from "express";
import { archiveController } from "../controllers/archiveController.js";
import { protact } from "../middleware/authen.js";
import mongoose from "mongoose";

const router = express.Router();

// 🆕 ROUTE POUR ARCHIVER UNE CONVERSATION
router.post("/:conversationId/archive", protact, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        error: "ID conversation invalide",
      });
    }

    console.log(
      `📁 Archivage conversation: ${conversationId} par user: ${userId}`
    );

    await archiveController.archiveConversation(userId, conversationId);

    res.json({
      success: true,
      message: "Conversation archivée",
      conversationId: conversationId,
      archivedAt: new Date(),
    });
  } catch (error) {
    console.error("❌ Erreur archivage:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 🆕 ROUTE POUR DÉSARCHIVER UNE CONVERSATION
router.post("/:conversationId/unarchive", protact, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        error: "ID conversation invalide",
      });
    }

    console.log(
      `📁 Désarchivage conversation: ${conversationId} par user: ${userId}`
    );

    await archiveController.unarchiveConversation(userId, conversationId);

    res.json({
      success: true,
      message: "Conversation désarchivée",
      conversationId: conversationId,
    });
  } catch (error) {
    console.error("❌ Erreur désarchivage:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 🆕 ROUTE POUR RÉCUPÉRER LES CONVERSATIONS ARCHIVÉES
router.get("/user/:userId", protact, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error:
          "Non autorisé à voir les conversations archivées d'un autre utilisateur",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: "ID utilisateur invalide",
      });
    }

    console.log(`📂 Récupération conversations archivées pour user: ${userId}`);

    const archivedConversations =
      await archiveController.getArchivedConversations(userId);

    res.json({
      success: true,
      conversations: archivedConversations,
      count: archivedConversations.length,
    });
  } catch (error) {
    console.error("❌ Erreur récupération conversations archivées:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 🆕 ROUTE POUR RÉCUPÉRER LE NOMBRE DE CONVERSATIONS ARCHIVÉES
router.get("/user/:userId/count", protact, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Non autorisé",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: "ID utilisateur invalide",
      });
    }

    const archivedCount = await archiveController.getArchivedCount(userId);

    res.json({
      success: true,
      archivedCount: archivedCount,
    });
  } catch (error) {
    console.error("❌ Erreur récupération compteur archivées:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 🆕 ROUTE POUR VÉRIFIER SI UNE CONVERSATION EST ARCHIVÉE
router.get("/:conversationId/status", protact, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        error: "ID conversation invalide",
      });
    }

    const isArchived = await archiveController.isConversationArchived(
      userId,
      conversationId
    );

    res.json({
      success: true,
      isArchived: isArchived,
      conversationId: conversationId,
    });
  } catch (error) {
    console.error("❌ Erreur vérification statut archivage:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
