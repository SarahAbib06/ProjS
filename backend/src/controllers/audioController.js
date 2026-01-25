// controllers/audioController.js - MODIFICATIONS
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import Participants from "../models/Participants.js";

import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export const sendAudioMessage = async (req, res) => {
  console.log("🎯 DÉBUT sendAudioMessage avec Cloudinary + Temps Réel");

  try {
    const { conversationId } = req.body;
    const senderId = req.user.id;
    const io = req.app.get("io"); // Récupérer l'instance Socket.io

    // 📋 VALIDATION DES DONNÉES
    console.log("📋 Validation des données...");
    console.log("- Conversation ID:", conversationId);
    console.log("- Sender ID:", senderId);
    console.log("- Fichier reçu:", req.file ? req.file.filename : "AUCUN");

    if (!conversationId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "ID de conversation requis" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Fichier audio requis" });
    }

    // 🔐 VÉRIFICATION ACCÈS CONVERSATION
    console.log("🔐 Vérification accès conversation...");
    const participant = await Participants.findOne({
      Id_Conversation: conversationId,
      Id_User: senderId,
    });

    if (!participant) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res
        .status(403)
        .json({ message: "Vous n'êtes pas membre de cette conversation" });
    }

    // ☁️ UPLOAD VERS CLOUDINARY
    console.log("☁️ Upload vers Cloudinary...");
    const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video",
      folder: "owly/audio_messages",
      format: "mp3",
      quality: "auto",
      chunk_size: 6000000,
    });

    console.log("✅ Upload Cloudinary réussi:", cloudinaryResult.secure_url);

    // 🗑️ SUPPRIMER LE FICHIER TEMPORAIRE
    fs.unlinkSync(req.file.path);

    // ⏱️ CALCULER LA DURÉE AUDIO
const audioDuration = cloudinaryResult.duration ? Math.round(cloudinaryResult.duration) : 30;
    // 💾 CRÉATION DU MESSAGE AUDIO
    console.log("💾 Création du message en base...");
    const newMessage = new Message({
      conversationId,
      Id_sender: senderId,
      typeMessage: "audio",
      audioUrl: cloudinaryResult.secure_url,
      audioDuration: audioDuration,
      fileSize: cloudinaryResult.bytes,
      fileName: req.file.originalname,
      content: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      cloudinaryFormat: cloudinaryResult.format,
    });

    await newMessage.save();
    console.log("✅ Message audio créé - ID:", newMessage._id);

    // 🔄 METTRE À JOUR LA CONVERSATION
    console.log("🔄 Mise à jour conversation...");
    await Conversation.findByIdAndUpdate(conversationId, {
      Id_message: newMessage._id,
      LastMessageRead: "🎤 Message audio",
      media: "audio",
      lastMessageAt: new Date(),
    });

    // 📦 POPULER LE MESSAGE POUR LA RÉPONSE
    console.log("📦 Préparation réponse...");
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("Id_sender", "username photo status")
      .populate("conversationId");

    // 🆕 DIFFUSION EN TEMPS RÉEL
    if (io) {
      console.log("🔊 Diffusion message audio en temps réel...");

      // 1. Diffuser aux participants de la conversation
      io.to(conversationId).emit("new_audio_message", {
        type: "audio",
        message: populatedMessage,
        conversationId: conversationId,
        timestamp: new Date(),
      });

      // 2. Notifier les autres participants
      const otherParticipants = await Participants.find({
        Id_Conversation: conversationId,
        Id_User: { $ne: senderId },
      }).populate("Id_User", "username");

      otherParticipants.forEach((participant) => {
        io.to(`user_${participant.Id_User._id}`).emit("new_message_alert", {
          type: "audio_message",
          conversationId: conversationId,
          senderId: senderId,
          senderName: populatedMessage.Id_sender.username,
          messagePreview: "🎤 Message audio",
          timestamp: new Date(),
          messageId: newMessage._id,
        });
      });

      console.log("✅ Message audio diffusé en temps réel");
    }

    console.log("🎉 MESSAGE AUDIO ENVOYÉ AVEC SUCCÈS");

    // ✅ RÉPONSE FINALE
    res.status(201).json({
      message: "Message audio envoyé avec succès",
      data: populatedMessage,
      cloudinaryInfo: {
        publicId: cloudinaryResult.public_id,
        format: cloudinaryResult.format,
        duration: cloudinaryResult.duration,
        durationFormatted: formatDuration(audioDuration),
      },
    });
  } catch (error) {
    console.error("❌ ERREUR sendAudioMessage:", error);

    // 🗑️ NETTOYAGE EN CAS D'ERREUR
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Erreur lors de l'envoi du message audio",
      error: error.message,
    });
  }
};

// 🆕 FONCTION POUR RÉCUPÉRER LES MESSAGES AUDIO D'UNE CONVERSATION
export const getAudioMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    console.log(
      "🔊 Récupération messages audio - Conversation:",
      conversationId
    );

    // Vérifier l'accès à la conversation
    const participant = await Participants.findOne({
      Id_Conversation: conversationId,
      Id_User: userId,
    });

    if (!participant) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    // Récupérer les messages audio
    const audioMessages = await Message.find({
      conversationId: conversationId,
      typeMessage: "audio",
    })
      .populate("Id_sender", "username photo")
      .sort({ time: -1 }); // Du plus récent au plus ancien

    console.log(`✅ ${audioMessages.length} messages audio trouvés`);

    res.json({
      success: true,
      messages: audioMessages,
    });
  } catch (error) {
    console.error("❌ Erreur récupération messages audio:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des messages audio",
      error: error.message,
    });
  }
};

// 🕒 FONCTION : FORMATER LA DURÉE
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

