// controllers/relationController.js (ou relationController.js)
import Relation from '../models/Relation.js';

export const relationController = {

  // BLOQUER un utilisateur
  blockUser: async (req, res) => {
    try {
      const blockerId = req.user.id;
      const { blockedUserId } = req.body;

      if (!blockedUserId) return res.status(400).json({ error: "blockedUserId requis" });
      if (blockerId === blockedUserId) return res.status(400).json({ error: "Impossible de se bloquer soi-même" });

      // Supprime toute relation existante dans les deux sens (bloqué ou pas)
      await Relation.deleteMany({
        $or: [
          { userId: blockerId, contactId: blockedUserId },
          { userId: blockedUserId, contactId: blockerId }
        ]
      });

      // Crée le nouveau blocage
      const relation = new Relation({
        userId: blockerId,
        contactId: blockedUserId,
        status: "blocked"
      });

      await relation.save();

      res.json({ success: true, message: "Utilisateur bloqué" });
    } catch (err) {
      console.error("Erreur blocage:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // DÉBLOQUER un utilisateur — CORRIGÉ À 100%
  unblockUser: async (req, res) => {
    try {
      const userId = req.user.id;
      const { blockedUserId } = req.body;

      if (!blockedUserId) return res.status(400).json({ error: "blockedUserId requis" });

      // SUPPRIME LE BLOCAGE DANS LES DEUX SENS (au cas où l'autre t'avait bloqué)
      await Relation.deleteMany({
        status: "blocked",
        $or: [
          { userId: userId, contactId: blockedUserId },
          { userId: blockedUserId, contactId: userId }
        ]
      });

      res.json({ success: true, message: "Utilisateur débloqué avec succès" });
    } catch (err) {
      console.error("Erreur déblocage:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // Vérifier si deux utilisateurs sont bloqués (dans un sens ou l'autre)
  isBlocked: async (userId1, userId2) => {
    const block = await Relation.findOne({
      status: "blocked",
      $or: [
        { userId: userId1, contactId: userId2 },
        { userId: userId2, contactId: userId1 }
      ]
    });
    return !!block;
  }
};