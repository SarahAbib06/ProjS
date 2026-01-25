// src/routes/reactionRoutes.js
import express from "express";
import {
  addReaction,
  removeReaction,
  getMessageReactions,
} from "../controllers/reactionController.js";

import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Utiliser authenticateToken au lieu de auth
router.post("/", authMiddleware, addReaction);
router.delete("/:messageId", authMiddleware, removeReaction);
router.get("/message/:messageId", authMiddleware, getMessageReactions);

// 🆕 AJOUTE CETTE ROUTE POUR LES RÉACTIONS DISPONIBLES
router.get("/available", authMiddleware, (req, res) => {
  res.json({
    success: true,
    reactions: ["❤️", "👍", "😂", "😮", "😢", "😡", "🎉", "🔥", "👏", "💯"]
  });
});

export default router;