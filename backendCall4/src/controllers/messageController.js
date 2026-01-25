// controllers/messageController.js
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import Participants from "../models/Participants.js";
import User from "../models/User.js";
import Relation from "../models/Relation.js";
import { conversationController } from "./conversationController.js";
import { pushNotificationService } from "../services/pushNotificationService.js";
import mongoose from "mongoose";
import crypto from "crypto";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// CLÉ SECRÈTE — METS ÇA DANS TON .env (64 caractères hex = 32 bytes)
const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY || "a".repeat(64);
const ALGORITHM = "aes-256-gcm";

// CHIFFREMENT
function encryptContent(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  const payload = {
    iv: iv.toString("hex"),
    data: encrypted,
    tag: authTag.toString("hex"),
  };
  return JSON.stringify(payload);
}

// DÉCHIFFREMENT
function decryptContent(stored) {
  if (!stored || typeof stored !== "string") return "[Message vide]";
  if (!stored.startsWith("{") || !stored.includes(":")) return stored;
  try {
    const payload = JSON.parse(stored);
    if (!payload.iv || !payload.data || !payload.tag)
      throw new Error("Format invalide");
    const iv = Buffer.from(payload.iv, "hex");
    const authTag = Buffer.from(payload.tag, "hex");
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, "hex"),
      iv
    );
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(payload.data, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.warn("Déchiffrement échoué → ancien message");
    return stored.length < 2000 ? stored : "[Corrompu]";
  }
}

let userPresence = new Map();

// 🆕 CONFIGURATION DES FICHIERS
const FILE_CONFIG = {
  image: {
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: "chat_images",
  },
  video: {
    allowedTypes: [
      "video/mp4",
      "video/mkv",
      "video/avi",
      "video/mov",
      "video/webm",
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: "chat_videos",
  },
  file: {
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "application/zip",
      "application/x-rar-compressed",
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    folder: "chat_files",
  },
};

// 🆕 VALIDATION DES FICHIERS
const validateFile = (file, allowedTypes, maxSize) => {
  if (!file || !file.buffer) {
    throw new Error("Fichier manquant");
  }

  if (file.size > maxSize) {
    throw new Error(
      `Fichier trop volumineux (max: ${maxSize / 1024 / 1024}MB)`
    );
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`Type de fichier non autorisé: ${file.mimetype}`);
  }

  return true;
};

// 🆕 FONCTION GÉNÉRIQUE POUR L'UPLOAD
const uploadToCloudinary = async (file, resourceType, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
        ...(resourceType === "image" && {
          quality: "auto",
          format: "jpg",
        }),
        ...(resourceType === "video" && {
          chunk_size: 6000000,
        }),
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

// 🆕 VALIDATION ET CONVERSION ID UTILISATEUR
const validateAndConvertUserId = (userId, fieldName = "ID utilisateur") => {
  if (!userId) {
    throw new Error(`${fieldName} manquant`);
  }

  let userIdString = userId;
  if (typeof userId === "object" && userId.toString) {
    userIdString = userId.toString();
  }

  userIdString = userIdString.trim();

  if (!mongoose.Types.ObjectId.isValid(userIdString)) {
    throw new Error(`${fieldName} invalide: "${userIdString}"`);
  }

  return new mongoose.Types.ObjectId(userIdString);
};

// 🆕 FONCTION UNIFIÉE POUR LA GESTION DES MESSAGES

const handleMessageCreation = async (messageData, io = null, userIdFromToken = null, additionalData = {}) => {
  const Id_sender = userIdFromToken;

  const {
    conversationId,
    Id_receiver,
    content,
    typeMessage = "text",
  } = messageData;

  if (!mongoose.Types.ObjectId.isValid(Id_sender)) {
    throw new Error("ID expéditeur invalide");
  }
  if (Id_receiver && !mongoose.Types.ObjectId.isValid(Id_receiver)) {
    throw new Error("ID destinataire invalide");
  }
  if (conversationId && !mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new Error("ID conversation invalide");
  }
  if (!content) {
    throw new Error("Le contenu du message est requis");
  }
  if (typeof content === "string" && content.trim().length === 0) {
    throw new Error("Le message ne peut pas être vide");
  }
  if (typeof content === "string" && content.length > 1000) {
    throw new Error("Le message est trop long (max 1000 caractères)");
  }
  const allowedTypes = ["text", "image", "video", "file", "emojis"];
  if (!allowedTypes.includes(typeMessage))
    throw new Error(`Type non supporté: ${typeMessage}`);

  let receiverId = Id_receiver ? Id_receiver.toString() : null;
  if (!receiverId && conversationId) {
    const participants = await Participants.find({
      Id_Conversation: conversationId,
    })
      .select("Id_User")
      .lean();
    if (participants.length < 2) {
      throw new Error(
        "Conversation invalide (doit avoir au moins 2 participants)"
      );
    }
    const otherParticipant = participants.find(
      (p) => p.Id_User.toString() !== Id_sender.toString()
    );
    if (!otherParticipant) {
      throw new Error(
        "Impossible de trouver le destinataire dans cette conversation"
      );
    }
    receiverId = otherParticipant.Id_User.toString();
  }
  if (!receiverId) {
    throw new Error(
      "Destinataire introuvable – Id_receiver ou conversationId requis"
    );
  }

  const blockExists = await Relation.findOne({
    status: "blocked",
    $or: [
      { userId: Id_sender, contactId: receiverId },
      { userId: receiverId, contactId: Id_sender },
    ],
  });
  if (blockExists) {
    throw new Error(
      "Impossible d'envoyer le message : vous avez bloqué cette personne ou elle vous a bloqué."
    );
  }

  let finalConversationId = conversationId;
  if (!conversationId) {
    const conv = await conversationController.getOrCreateConversation(
      Id_sender,
      receiverId
    );
    finalConversationId = conv._id;
  }

  const encryptedContent = typeMessage === 'text' ? encryptContent(content.trim()) : content;

    // CORRIGÉ : On sauvegarde aussi les métadonnées image/video/file dans la BDD
  const message = new Message({
    conversationId: finalConversationId,
    Id_sender,
    content: encryptedContent,
    typeMessage,
    status: "sent",
    time: new Date(),
    readBy: [],
    unreadFor: [],

    // AJOUT CRUCIAL : sauvegarde des infos multimédia dans MongoDB
    ...(typeMessage === 'image' && additionalData.imageInfo && { imageInfo: additionalData.imageInfo }),
    ...(typeMessage === 'video' && additionalData.videoInfo && { videoInfo: additionalData.videoInfo }),
    ...(typeMessage === 'file' && additionalData.fileInfo && { fileInfo: additionalData.fileInfo })

  });
  const savedMessage = await message.save();

  try {
    const participants = await Participants.find({
      Id_Conversation: finalConversationId,
    });
    const bulkOperations = [];
    const participantsToNotify = [];

    for (const participant of participants) {
      if (participant.Id_User.toString() !== Id_sender.toString()) {
        participantsToNotify.push(participant.Id_User);
        bulkOperations.push({
          updateOne: {
            filter: {
              _id: finalConversationId,
              "unreadCounts.userId": participant.Id_User,
            },
            update: {
              $inc: { "unreadCounts.$.count": 1 },
              $set: { lastMessageAt: new Date() },
            },
          },
        });
      }
    }

    if (bulkOperations.length > 0) {
      await Conversation.bulkWrite(bulkOperations);
      const conv = await Conversation.findById(finalConversationId);
      const missing = [];
      for (const uid of participantsToNotify) {
        if (
          !conv.unreadCounts?.some(
            (u) => u.userId.toString() === uid.toString()
          )
        ) {
          missing.push({
            updateOne: {
              filter: { _id: finalConversationId },
              update: {
                $push: { unreadCounts: { userId: uid, count: 1 } },
                $set: { lastMessageAt: new Date() },
              },
            },
          });
        }
      }
      if (missing.length > 0) await Conversation.bulkWrite(missing);
    }
  } catch (error) {
    console.error("Erreur mise à jour compteurs:", error.message);
  }

  try {
    console.log("Gestion intelligente des notifications...");

    let participants = [];
    const conversation = await Conversation.findById(finalConversationId);
    if (conversation && conversation.type === "group") {
      participants = conversation.Id_participant.map((userId) => ({
        Id_User: { _id: userId },
      }));
    } else {
      participants = await Participants.find({
        Id_Conversation: finalConversationId,
      }).populate("Id_User", "username");
    }

    const sender = await User.findById(Id_sender);
    const senderName = sender?.username || "Quelqu'un";

    let notificationBody = "";
    if (typeMessage === "text") {
      notificationBody =
        content.length > 30 ? content.substring(0, 30) + "..." : content;
    } else if (typeMessage === "image") {
      notificationBody = "📷 Image partagée";
    } else if (typeMessage === "video") {
      notificationBody = "🎥 Vidéo partagée";
    } else if (typeMessage === "file") {
      notificationBody = "📎 Fichier partagé";
    }

    for (let participant of participants) {
      const participantId = participant.Id_User._id.toString();
      if (participantId !== Id_sender.toString()) {
        const participantUser = await User.findById(participantId);
        const participantName = participantUser?.username || "Utilisateur";

        const notificationsEnabled = await areNotificationsEnabled(
          participantId
        );
        if (!notificationsEnabled) {
          console.log(
            `NOTIFICATIONS COMPLÈTEMENT DÉSACTIVÉES pour: ${participantName}`
          );
          continue;
        }

        const isUserOnline = await isUserOnlineAdvanced(io, participantId);
        console.log(
          `${participantName}: En ligne=${isUserOnline}, Notifications=ACTIVÉES`
        );

        const notificationTitle =
          conversation?.type === "group"
            ? `${conversation.groupName} - ${senderName}`
            : `Nouveau message de ${senderName}`;

        if (isUserOnline && io) {
          console.log(`WebSocket à: ${participantName}`);
          io.to(`user_${participantId}`).emit("new_message_alert", {
            type: "new_message",
            conversationId: finalConversationId,
            senderId: savedMessage.Id_sender,
            senderName: senderName,
            messagePreview: notificationBody,
            timestamp: new Date(),
            messageId: savedMessage._id,
            isGroup: conversation?.type === "group",
            groupName: conversation?.groupName,
          });
        } else {
          console.log(`Push notification à: ${participantName}`);
          await pushNotificationService.sendToUser(
            participantId,
            notificationTitle,
            notificationBody,
            {
              conversationId: finalConversationId.toString(),
              messageId: savedMessage._id.toString(),
              type: "new_message",
              senderName: senderName,
              isGroup: conversation?.type === "group",
              groupName: conversation?.groupName,
            }
          );
        }
      }
    }
  } catch (error) {
    console.log("Erreur notifications:", error.message);
  }

  if (io) {
    const conversation = await Conversation.findById(finalConversationId);

    const messageToEmit = {
      _id: savedMessage._id,
      conversationId: finalConversationId,
      Id_sender,
      content: typeMessage === "text" ? content.trim() : content,
      typeMessage,
      status: savedMessage.status,
      createdAt: savedMessage.createdAt,     // IMPORTANT
      timestamp: savedMessage.createdAt,
      isGroup: conversation?.type === "group",
      ...additionalData,
    };

    io.to(finalConversationId.toString()).emit("new_message", messageToEmit);
  }

    const conversation = await Conversation.findById(finalConversationId);

  return {
    _id: savedMessage._id,
    conversationId: finalConversationId,
    Id_sender,
    content: typeMessage === "text" ? content.trim() : content,
    typeMessage,
    status: savedMessage.status,
    createdAt: savedMessage.createdAt,       // IMPORTANT
    timestamp: savedMessage.createdAt,
    isGroup: conversation?.type === "group",
    ...additionalData,
  };
};

export const messageController = {
  createMessage: async (messageData, io = null, userIdFromToken = null) => {
    return await handleMessageCreation(messageData, io, userIdFromToken);
  },

  // IMAGE
  uploadImageMessage: async (file, messageData, io = null, userIdFromToken = null) => {
    try {
      validateAndConvertUserId(userIdFromToken, 'ID expéditeur');
      validateFile(file, FILE_CONFIG.image.allowedTypes, FILE_CONFIG.image.maxSize);

      const uploadResult = await uploadToCloudinary(file, 'image', FILE_CONFIG.image.folder);

      const messageDataForCreate = {
        conversationId: messageData.conversationId,
        Id_receiver: messageData.Id_receiver,
        content: uploadResult.secure_url,
        typeMessage: "image",
      };

      const additionalData = {
        imageInfo: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          width: uploadResult.width || 0,
          height: uploadResult.height || 0
        }
      };

      return await handleMessageCreation(messageDataForCreate, io, userIdFromToken, additionalData);
    } catch (error) {
      console.error('Erreur upload image:', error);

      throw new Error(`Échec upload image: ${error.message}`);
    }
  },


  // VIDÉO
  uploadVideoMessage: async (file, messageData, io = null, userIdFromToken = null) => {
    try {
      validateAndConvertUserId(userIdFromToken, 'ID expéditeur');
      validateFile(file, FILE_CONFIG.video.allowedTypes, FILE_CONFIG.video.maxSize);

      const uploadResult = await uploadToCloudinary(file, 'video', FILE_CONFIG.video.folder);


      const messageDataForCreate = {
        conversationId: messageData.conversationId,
        Id_receiver: messageData.Id_receiver,
        content: uploadResult.secure_url,
        typeMessage: "video",
      };

      const additionalData = {
        videoInfo: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          duration: uploadResult.duration || 0,
          width: uploadResult.width || 0,
          height: uploadResult.height || 0,
          bytes: uploadResult.bytes
        }
      };

      return await handleMessageCreation(messageDataForCreate, io, userIdFromToken, additionalData);
    } catch (error) {
      console.error('Erreur upload vidéo:', error);

      throw new Error(`Échec upload vidéo: ${error.message}`);
    }
  },

  // FICHIER
  uploadFileMessage: async (file, messageData, io = null, userIdFromToken = null) => {
    try {
      validateAndConvertUserId(userIdFromToken, 'ID expéditeur');
      validateFile(file, FILE_CONFIG.file.allowedTypes, FILE_CONFIG.file.maxSize);

      const uploadResult = await uploadToCloudinary(file, 'raw', FILE_CONFIG.file.folder);

      const messageDataForCreate = {
        conversationId: messageData.conversationId,
        Id_receiver: messageData.Id_receiver,
        content: uploadResult.secure_url,
        typeMessage: 'file'
      };

      const additionalData = {
        fileInfo: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          originalFilename: uploadResult.original_filename || messageData.originalName || 'fichier',
          bytes: uploadResult.bytes
        }
      };

      return await handleMessageCreation(messageDataForCreate, io, userIdFromToken, additionalData);
    } catch (error) {
      console.error('Erreur upload fichier:', error);
      throw new Error(`Échec upload fichier: ${error.message}`);
    }
  },

  // 🆕 NOUVELLE FONCTION DEMANDÉE : CONTENU MULTIMÉDIA COMME MESSENGER
  getConversationMedia: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ success: false, error: "ID conversation invalide" });
      }

      const skip = (page - 1) * limit;

      // Récupère TOUS les messages médias (image + vidéo + fichier)
      const messages = await Message.find({
        conversationId,
        typeMessage: { $in: ['image', 'video', 'file'] }
      })
        .sort({ time: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Sépare images/vidéos et fichiers
      const media = [];
      const files = [];

      for (const msg of messages) {
        const sender = await User.findById(msg.Id_sender).select('username').lean();
        const senderName = sender?.username || "Inconnu";

        const base = {
          messageId: msg._id.toString(),
          senderId: msg.Id_sender.toString(),
          senderName,
          timestamp: msg.time || msg.createdAt,
          url: msg.content
        };

        if (msg.typeMessage === 'image') {
          media.push({ ...base, type: 'image', width: msg.imageInfo?.width, height: msg.imageInfo?.height });
        } else if (msg.typeMessage === 'video') {
          media.push({ ...base, type: 'video', duration: msg.videoInfo?.duration });
        } else if (msg.typeMessage === 'file') {
          files.push({
            ...base,
            type: 'file',
            fileName: msg.fileInfo?.originalFilename || msg.fileInfo?.fileName || 'Fichier',
            size: msg.fileInfo?.bytes || msg.fileInfo?.fileSize || 0,
            format: msg.fileInfo?.format || ''
          });
        }
      }

      res.json({
        success: true,
        media: { // Onglet "Médias" (images + vidéos)
          items: media,
          hasMore: media.length === limit
        },
        files: { // Onglet "Fichiers"
          items: files,
          hasMore: files.length === limit
        },
        page,
        limit
      });
    } catch (error) {
      console.error("Erreur getConversationMedia:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // RÉCUPÉRER LES MESSAGES → DÉCHIFFRE À LA VOLÉE
  getConversationMessages: async (conversationId, page = 1, limit = 50) => {
    try {
      console.log(
        `Récupération messages conversation ${conversationId}, page ${page}`
      );

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error("ID conversation invalide");
      }
      const skip = (page - 1) * limit;
      const messages = await Message.find({ conversationId: conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'reactions',
          populate: {
            path: 'id_user',
            select: 'username'
          }

        })
        .lean();

      const decryptedMessages = messages.map((msg) => ({
        ...msg,
        _id: msg._id.toString(),
        conversationId: msg.conversationId.toString(),
        Id_sender: msg.Id_sender.toString(),
        content:
          msg.typeMessage === "text"
            ? decryptContent(msg.content)
            : msg.content,
        timestamp: msg.time || msg.createdAt,
      }));

      console.log(`${decryptedMessages.length} messages trouvés et déchiffrés`);
      return decryptedMessages;
    } catch (error) {
      console.error("Erreur:", error);
      throw error;
    }
  },

  setUserPresence: (presenceMap) => {
    userPresence = presenceMap;
  },

  sendGroupMessage: async (
    groupId,
    senderId,
    content,
    typeMessage = "text",
    io = null
  ) => {
    const messageData = {
      conversationId: groupId,
      content: content,
      typeMessage: typeMessage,
    };
    return await handleMessageCreation(messageData, io, senderId);
  },

  pinMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;
      const io = req.io;

      const message = await Message.findById(messageId);
      if (!message)
        return res
          .status(404)
          .json({ success: false, error: "Message non trouvé" });

      const conv = await Conversation.findById(message.conversationId);
      const isParticipant =
        conv?.participants?.some((p) => p.toString() === userId) ||
        (await Participants.findOne({
          Id_Conversation: message.conversationId,
          Id_User: userId,
        }));
      if (!isParticipant)
        return res.status(403).json({ success: false, error: "Non autorisé" });

      message.isPinned = true;
      message.pinnedBy = userId;
      message.pinnedAt = new Date();
      await message.save();

      if (io) {
        io.to(message.conversationId.toString()).emit("message:pinned", {
          messageId: message._id,
          pinnedBy: userId,
          pinnedAt: message.pinnedAt,
          content:
            message.typeMessage === "text"
              ? decryptContent(message.content)
              : message.content,
          typeMessage: message.typeMessage,
        });
      }

      res.json({ success: true, message: "Message épinglé" });
    } catch (error) {
      console.error("Erreur pin:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  unpinMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const io = req.io;

      const message = await Message.findByIdAndUpdate(
        messageId,
        { $unset: { isPinned: "", pinnedBy: "", pinnedAt: "" } },
        { new: true }
      );

      if (!message)
        return res.status(404).json({ error: "Message non trouvé" });

      if (io) {
        io.to(message.conversationId.toString()).emit("message:unpinned", {
          messageId: message._id,
        });
      }

      res.json({ success: true, message: "Message désépinglé" });
    } catch (error) {
      console.error("Erreur unpin:", error);
      res.status(500).json({ error: error.message });
    }
  },

  getPinnedMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await Message.find({ conversationId, isPinned: true })
        .sort({ pinnedAt: -1 })
        .lean();

      const decrypted = messages.map((m) => ({
        ...m,
        content:
          m.typeMessage === "text" ? decryptContent(m.content) : m.content,
      }));

      res.json({ success: true, pinnedMessages: decrypted });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  // TRANSFERT DE MESSAGE (FORWARD) — FONCTIONNE À 100%
  forwardMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { targetConversationId } = req.body;
      const userId = req.user.id;
      const io = req.io;

      if (
        !mongoose.Types.ObjectId.isValid(messageId) ||
        !mongoose.Types.ObjectId.isValid(targetConversationId)
      ) {
        return res.status(400).json({ success: false, error: "ID invalide" });
      }

      const original = await Message.findById(messageId);
      if (!original)
        return res
          .status(404)
          .json({ success: false, error: "Message non trouvé" });

      // Vérif accès source
      const sourceConv = await Conversation.findById(original.conversationId);
      const inSource =
        sourceConv?.Id_participant?.some((p) => p.toString() === userId) ||
        (await Participants.findOne({
          Id_Conversation: original.conversationId,
          Id_User: userId,
        }));
      if (!inSource)
        return res
          .status(403)
          .json({ success: false, error: "Accès refusé (source)" });

      // Vérif accès cible
      const targetConv = await Conversation.findById(targetConversationId);
      const inTarget =
        targetConv?.Id_participant?.some((p) => p.toString() === userId) ||
        (await Participants.findOne({
          Id_Conversation: targetConversationId,
          Id_User: userId,
        }));
      if (!inTarget)
        return res
          .status(403)
          .json({ success: false, error: "Accès refusé (cible)" });

      // Re-chiffrement si texte
      let newContent = original.content;
      if (original.typeMessage === "text") {
        newContent = encryptContent(decryptContent(original.content));
      }

      const forwarded = new Message({
        conversationId: targetConversationId,
        Id_sender: userId,
        content: newContent,
        typeMessage: original.typeMessage,
        status: "sent",
        isForwarded: true,
        forwardedFrom: original._id,
        originalSender: original.Id_sender,
        forwardedAt: new Date(),
        forwardCount: (original.forwardCount || 0) + 1,
        readBy: [{ userId, readAt: new Date() }],
      });

      await forwarded.save();

      // Mise à jour unreadCounts
      await Conversation.findByIdAndUpdate(
        targetConversationId,
        {
          lastMessageAt: new Date(),
          $inc: { "unreadCounts.$[e].count": 1 },
        },
        { arrayFilters: [{ "e.userId": { $ne: userId } }] }
      );

      // Socket.io
      if (io) {
        const originalSender = await User.findById(original.Id_sender).select(
          "username"
        );
        const toEmit = {
          ...forwarded.toObject(),
          content:
            forwarded.typeMessage === "text"
              ? decryptContent(newContent)
              : newContent,
          Id_sender: { _id: userId, username: req.user.username },
          originalSender: {
            _id: originalSender._id,
            username: originalSender.username,
          },
        };
        io.to(targetConversationId.toString()).emit("new_message", {
          message: toEmit,
          conversationId: targetConversationId,
        });
      }

      return res.json({
        success: true,
        message: "Message transféré avec succès",
        forwardedMessage: forwarded,
      });
    } catch (error) {
      console.error("Erreur forwardMessage:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  // 🆕 CRÉATION DE MESSAGE D'APPEL (MANQUÉ OU TERMINÉ)
  createCallMessage: async (data, io) => {
    return await createCallMessage(data, io);
  },
}; // ← Fermeture CORRECTE de l’objet messageController

// FONCTIONS ANNEXES
async function isUserOnlineAdvanced(io, userId) {
  try {
    if (userPresence && userPresence.has(userId)) {
      const presence = userPresence.get(userId);
      const isOnline =
        presence.status === "online" &&
        presence.sessions &&
        presence.sessions.length > 0;
      console.log(
        `🔍 Présence mémoire ${userId}: ${isOnline} (${presence.sessions?.length} sessions)`
      );
      return isOnline;
    }
    const user = await User.findById(userId);
    const isOnlineDB =
      user &&
      user.status === "online" &&
      user.activeSessions &&
      user.activeSessions.length > 0;
    console.log(
      `🔍 Présence BDD ${userId}: ${isOnlineDB} (${user?.activeSessions?.length} sessions)`
    );
    return isOnlineDB;
  } catch (error) {
    console.log("⚠️ Erreur vérification présence avancée:", error.message);
    const userRoom = io?.sockets?.adapter?.rooms?.get(`user_${userId}`);
    const isOnlineWS = userRoom && userRoom.size > 0;
    console.log(`🔍 Présence WebSocket ${userId}: ${isOnlineWS}`);
    return isOnlineWS;
  }
}

async function areNotificationsEnabled(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return true;
    if (
      user.notificationPreferences &&
      user.notificationPreferences.pushEnabled === false
    ) {
      return false;
    }
    return true;
  } catch (error) {
    console.log("⚠️ Erreur vérification notifications:", error.message);
    return true;
  }
}

async function shouldSendPushNotification(userId) {
  try {
    const user = await User.findById(userId);

    if (!user) return true;

    if (
      user.notificationPreferences &&
      user.notificationPreferences.pushEnabled === false
    ) {
      console.log(`🔕 Notifications désactivées pour: ${user.username}`);
      return false;
    }

    if (
      user.notificationPreferences &&
      user.notificationPreferences.quietHours &&
      user.notificationPreferences.quietHours.enabled
    ) {
      const now = new Date();
      const currentTime =
        now.getHours().toString().padStart(2, "0") +
        ":" +
        now.getMinutes().toString().padStart(2, "0");
      const { start, end } = user.notificationPreferences.quietHours;

      if (currentTime >= start || currentTime <= end) {
        console.log(
          `🌙 Heures silencieuses pour: ${user.username} (${start}-${end})`
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.log("⚠️ Erreur vérification push:", error.message);
    return true;
  }
}

// 🆕 FONCTION POUR CRÉER UN MESSAGE D'APPEL (MANQUÉ OU TERMINÉ)
const createCallMessage = async (data, io) => {
  try {
    const { conversationId, callerId, callType, status, duration } = data;

    if (!conversationId || !callerId || !callType) {
      throw new Error("Données d'appel incomplètes");
    }

    let messageContent = "";
    if (status === "missed") {
      messageContent =
        callType === "audio"
          ? "Appel audio manqué"
          : "Appel vidéo manqué";
    } else if (status === "completed" && duration !== undefined) {
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      const durationStr =
        mins > 0
          ? `${mins}m ${secs}s`
          : `${secs}s`;
      messageContent =
        callType === "audio"
          ? `Appel audio terminé - Durée: ${durationStr}`
          : `Appel vidéo terminé - Durée: ${durationStr}`;
    } else {
      return null;
    }

    const message = new Message({
      conversationId,
      Id_sender: callerId,
      content: messageContent,
      typeMessage: "text",
      status: "sent",
      time: new Date(),
      readBy: [],
      unreadFor: [],
      // 🆕 CHAMPS D'APPEL
      isCallMessage: true,
      callType,
      callStatus: status,
      callDuration: status === "completed" ? duration : null,
    });

    const savedMessage = await message.save();

    // Mettre à jour les compteurs de messages non lus
    try {
      const participants = await Participants.find({
        Id_Conversation: conversationId,
      });

      const bulkOperations = [];
      for (const participant of participants) {
        if (participant.Id_User.toString() !== callerId.toString()) {
          bulkOperations.push({
            updateOne: {
              filter: {
                _id: conversationId,
                "unreadCounts.userId": participant.Id_User,
              },
              update: {
                $inc: { "unreadCounts.$.count": 1 },
                $set: { lastMessageAt: new Date() },
              },
            },
          });
        }
      }

      if (bulkOperations.length > 0) {
        await Conversation.bulkWrite(bulkOperations);
      }
    } catch (error) {
      console.error("Erreur mise à jour compteurs d'appel:", error.message);
    }

    // Émettre le message via socket
    if (io) {
      io.to(conversationId.toString()).emit("new_message", {
        _id: savedMessage._id,
        conversationId,
        Id_sender: callerId,
        content: messageContent,
        typeMessage: "text",
        status: savedMessage.status,
        createdAt: savedMessage.createdAt,
        timestamp: savedMessage.createdAt,
        isCallMessage: true,
        callType,
        callStatus: status,
      });
    }

    return {
      _id: savedMessage._id,
      conversationId,
      Id_sender: callerId,
      content: messageContent,
      typeMessage: "text",
      status: savedMessage.status,
      createdAt: savedMessage.createdAt,
      timestamp: savedMessage.createdAt,
      isCallMessage: true,
      callType,
      callStatus: status,
    };
  } catch (error) {
    console.error("❌ Erreur création message d'appel:", error.message);
    return null;
  }
};