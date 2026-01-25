// src/models/Message.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    Id_sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Système de gestion des lectures
    readBy: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
        _id: false,
      },
    ],

    content: {
      type: String,
      default: null,
    },

    typeMessage: {
      type: String,
      enum: ["text", "image", "video", "audio", "file", "emojis"],
      default: "text",
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },

    isPinned: { type: Boolean, default: false },
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pinnedAt: { type: Date },

    // AJOUT : Réactions aux messages
    reactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Reaction",
      },
    ],

    // NOUVEAUX CHAMPS POUR LE TRANSFERT (FORWARD) DE MESSAGE
    isForwarded: {
      type: Boolean,
      default: false,
      index: true, // Très utile pour filtrer rapidement les messages transférés
    },
    forwardedFrom: {
      type: Schema.Types.ObjectId,
      ref: "Message", // Référence au message original
      default: null,
      index: true,
    },
    originalSender: {
      type: Schema.Types.ObjectId,
      ref: "User", // Qui a envoyé le message à l'origine
      default: null,
    },
    forwardedAt: {
      type: Date,
      default: Date.now,
    },
    // Optionnel : on peut ajouter un champ pour savoir combien de fois il a été transféré
    forwardCount: {
      type: Number,
      default: 0,
      min: 0,
    },
     

    // Ajoute ça dans ton messageSchema, juste avant timestamps
imageInfo: {
  url: String,
  publicId: String,
  width: Number,
  height: Number
},
videoInfo: {
  url: String,
  publicId: String,
  duration: Number,
  width: Number,
  height: Number
},
fileInfo: {
  url: String,
  publicId: String,
  originalFilename: String,
  bytes: Number
},

// 🆕 CHAMPS POUR LES MESSAGES D'APPEL (appel manqué ou appel terminé)
isCallMessage: {
  type: Boolean,
  default: false,
  index: true,
},
callType: {
  type: String,
  enum: ["audio", "video"],
  default: null,
},
callStatus: {
  type: String,
  enum: ["missed", "completed"],
  default: null,
},
callDuration: {
  type: Number, // durée en secondes
  default: null,
},
    
  },
  {
    timestamps: true,
  }
);

// INDEXES POUR LES PERFORMANCES
messageSchema.index({ conversationId: 1, createdAt: -1 }); // Pagination des messages
messageSchema.index({ Id_sender: 1 });
messageSchema.index({ "readBy.userId": 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ reactions: 1 });
messageSchema.index({ isForwarded: 1 }); // Recherche rapide des messages transférés
messageSchema.index({ forwardedFrom: 1 }); // Tracer la chaîne de transfert
messageSchema.index({ originalSender: 1 }); // Afficher "Transféré de @user"

// Index composé utile pour l'affichage des messages transférés dans une conversation
messageSchema.index({ conversationId: 1, isForwarded: 1, createdAt: -1 });

const Message = model("Message", messageSchema);

export default Message;