// src/controllers/accountController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Relation from "../models/Relation.js";
import cloudinary from "../config/cloudinary.js";
import Conversation from "../models/Conversation.js";
import Participants from "../models/Participants.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";

export const deleteAccount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Mot de passe requis." });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    // ---------------------------------------------------------
    // 🔥 Fonction interne : extraction du publicId Cloudinary
    // ---------------------------------------------------------
    const deleteCloudinaryFile = async (url) => {
      if (!url) return;

      try {
        const filename = url.split("/").pop(); // ex: abcdef.png
        const publicId = filename.split(".")[0]; // abcdef

        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.log("Échec suppression Cloudinary :", err);
      }
    };

    // ---------------------------------------------------------
    // 1️⃣ Supprimer photo de profil + QR code
    // ---------------------------------------------------------
    await deleteCloudinaryFile(user.profilePicture);
    await deleteCloudinaryFile(user.qrCode);

    // ---------------------------------------------------------
    // 2️⃣ Chercher tous les messages de l’utilisateur
    //     pour supprimer les fichiers Cloudinary (images/videos/files)
    // ---------------------------------------------------------
    const userMessages = await Message.find({ Id_sender: userId }).session(session);

    for (const msg of userMessages) {
      if (
        msg.typeMessage !== "text" &&
        msg.typeMessage !== "emojis" &&
        msg.content &&
        msg.content.includes("cloudinary")
      ) {
        await deleteCloudinaryFile(msg.content);
      }
    }

    // ---------------------------------------------------------
    // 3️⃣ Supprimer relations (bloqués, amis, pending)
    // ---------------------------------------------------------
    await Relation.deleteMany({
      $or: [{ userId }, { contactId: userId }],
    }).session(session);

    // ---------------------------------------------------------
    // 4️⃣ Trouver toutes les conversations où il est participant
    // ---------------------------------------------------------
    const participantEntries = await Participants.find({ Id_User: userId }).session(session);
    const convIds = participantEntries.map((p) => p.Id_Conversation);

    // Supprimer son entrée dans Participants
    await Participants.deleteMany({ Id_User: userId }).session(session);

    // ---------------------------------------------------------
    // 5️⃣ Supprimer messages envoyés par l’utilisateur
    // ---------------------------------------------------------
    await Message.deleteMany({ Id_sender: userId }).session(session);

    // ---------------------------------------------------------
    // 6️⃣ Supprimer conversations créées par lui
    // ---------------------------------------------------------
    const convCreated = await Conversation.find({ createdBy: userId }).session(session);
    const createdIds = convCreated.map((c) => c._id);

    await Conversation.deleteMany({ createdBy: userId }).session(session);
    await Participants.deleteMany({ Id_Conversation: { $in: createdIds } }).session(session);
    await Message.deleteMany({ conversationId: { $in: createdIds } }).session(session);

    // ---------------------------------------------------------
    // 7️⃣ Supprimer les conversations où il ne reste aucun participant
    // ---------------------------------------------------------
    for (let convId of convIds) {
      const count = await Participants.countDocuments({ Id_Conversation: convId }).session(session);

      if (count === 0) {
        await Conversation.deleteOne({ _id: convId }).session(session);
        await Message.deleteMany({ conversationId: convId }).session(session);
      }
    }

    // ---------------------------------------------------------
    // 8️⃣ Supprimer l’utilisateur final
    // ---------------------------------------------------------
    await User.deleteOne({ _id: userId }).session(session);

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Compte supprimé avec succès, toutes les données associées ont été effacées.",
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Erreur suppression compte:", error);
    return res.status(500).json({ message: "Erreur serveur." });
  } finally {
    session.endSession();
  }
};
// --- Liste des utilisateurs bloqués ---
export const getBlockedUsers = async (req, res) => {
  try {
    const blockedRelations = await Relation.find({
      userId: req.user._id,
      status: "blocked"
    });

    // Extraire tous les contactId
    const blockedUserIds = blockedRelations.map(relation => relation.contactId);

    // Récupérer les informations des utilisateurs bloqués
    const blockedUsers = await User.find(
      { _id: { $in: blockedUserIds } },
      "username email profilePicture status lastSeen"
    );

    // Combiner les données
    const result = blockedRelations.map(relation => {
      const user = blockedUsers.find(u => u._id.toString() === relation.contactId.toString());
      return {
        _id: relation._id,
        contactId: user || { _id: relation.contactId }, // Fallback si utilisateur non trouvé
        status: relation.status,
        addedAt: relation.addedAt
      };
    });

   
    res.json(result);
  } catch (err) {
    console.error("Erreur getBlockedUsers:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
// --- Débloquer un utilisateur ---
export const unblockUser = async (req, res) => {
  try {
    const { contactId } = req.params;

    const relation = await Relation.findOne({
      userId: req.user._id,
      contactId,
      status: "blocked"
    });

    if (!relation) {
      return res.status(404).json({
        message: "Utilisateur introuvable ou non bloqué."
      });
    }

    // Suppression totale de la relation
    await Relation.deleteOne({ _id: relation._id });

    return res.json({
      message: "Utilisateur débloqué. Relation supprimée définitivement."
    });

  } catch (err) {
    console.error("Erreur unblockUser:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Le nouveau mot de passe et la confirmation ne correspondent pas." });
    }

    // --- Vérification de la complexité du mot de passe ---
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[{\]};:'"\\|,.<>/?`~]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: ' mot de passe faible',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect." });
    }

    // Hash du nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.passwordHash = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Mot de passe mis à jour avec succès !" });
  } catch (error) {
    console.error("Erreur changement mot de passe:", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};
