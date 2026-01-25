import express from "express";
import { messageController } from "../controllers/messageController.js";
import {
  sendAudioMessage,
  getAudioMessages,
} from "../controllers/audioController.js";
import { protact } from "../middleware/authen.js";
import audioUpload from "../middleware/audioUpload.js";

const router = express.Router();

// Récupération des messages d'une conversation
router.get("/:conversationId", protact, async (req, res) => {
  try {
    console.log(
      "API - Récupération messages conversation:",
      req.params.conversationId
    );

    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await messageController.getConversationMessages(
      conversationId,
      page,
      limit
    );

    console.log(`API - ${messages.length} messages récupérés`);
    res.json({
      success: true,
      messages: messages,
      page: page,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("API - Erreur:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ROUTES AUDIO (inchangées)
router.post(
  "/audio/send",
  protact,
  (req, res, next) => {
    console.log("DEBUG AVANT MULTER:");
    console.log("- Content-Type:", req.headers["content-type"]);
    console.log("- Method:", req.method);
    console.log("- URL:", req.url);
    console.log("- Body keys:", Object.keys(req.body || {}));
    console.log("- Body content:", req.body);
    console.log("- Has file property:", "file" in req);
    console.log("- Has files property:", "files" in req);
    next();
  },
  audioUpload.single("audio"),
  (req, res, next) => {
    console.log("DEBUG APRÈS MULTER:");
    console.log("- File received:", req.file);
    console.log("- Files received:", req.files);
    console.log("- Body after Multer:", req.body);
    console.log("- ConversationId in body:", req.body?.conversationId);

    if (!req.file) {
      console.log("MULTER N'A PAS REÇU LE FICHIER");
      return res.status(400).json({
        message: "Fichier non reçu par Multer - Debug info",
        debug: {
          contentType: req.headers["content-type"],
          bodyKeys: Object.keys(req.body),
          bodyContent: req.body,
          hasFile: !!req.file,
        },
      });
    }

    console.log("Fichier reçu par Multer:", req.file.originalname);
    next();
  },
  sendAudioMessage
);

router.get("/audio/:conversationId", protact, getAudioMessages);

// NOUVELLES ROUTES ÉPINGLER / DÉSÉPINGLER (ajoutées sans toucher au reste)
router.post("/:messageId/pin", protact, messageController.pinMessage);
router.post("/:messageId/unpin", protact, messageController.unpinMessage);
// Route pour la galerie médias/fichiers (comme Messenger)
router.get('/:conversationId/media', protact, messageController.getConversationMedia);



// Bonus : récupérer les messages épinglés d'une conversation (super utile pour l'affichage en haut)
router.get(
  "/:conversationId/pinned",
  protact,
  messageController.getPinnedMessages
);
//pour trensfer de msg
router.post("/:messageId/forward", protact, messageController.forwardMessage);

export default router;
