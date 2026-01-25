import mongoose from "mongoose";

const { Schema, model } = mongoose;

const conversationSchema = new Schema(
  {
    // Liste des participants (tu références bien ta collection Participants ? sinon remplace par 'User')
    Id_participant: [
      {
        type: Schema.Types.ObjectId,
        ref: "Participants", // ou 'User' si tu n'as pas de table Participants séparée
        required: true,
      },
    ],

    // Compteurs de messages non lus par utilisateur
    unreadCounts: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        count: {
          type: Number,
          default: 0,
          min: 0,
        },
        _id: false, // pas d'_id inutile sur chaque entrée
      },
    ],
    // 🆕 NOUVEAU : Archivage par utilisateur
    archivedBy: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        archivedAt: {
          type: Date,
          default: Date.now,
        },
        _id: false,
      },
    ],

    // Dernier message (pour trier les conversations)
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },

    // Nom du groupe (obligatoire si type === 'group')
    groupName: {
      type: String,
      required: function () {
        return this.type === "group";
      },
      default: null,
    },

    // Photo de groupe
    groupPic: {
      type: String,
      default: null,
    },

    // Créateur de la conversation
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Type de conversation
    type: {
      type: String,
      enum: ["private", "group"],
      required: true,
      default: "private",
    },
  },
  {
    // Timestamps automatiques (createdAt + updatedAt)
    timestamps: true,
  }
);

// Index très importants pour les performances d’un chat
conversationSchema.index({ lastMessageAt: -1 }); // tri des conversations récentes
conversationSchema.index({ Id_participant: 1 }); // recherche rapide par participant
conversationSchema.index({ "unreadCounts.userId": 1 }); // trouver les unread d’un user
conversationSchema.index({ "archivedBy.userId": 1 }); // 🆕 Index pour l'archivage
conversationSchema.index({ type: 1 });
conversationSchema.index({ createdBy: 1 });
conversationSchema.index({ Id_participant: 1, lastMessageAt: -1 }); // combo gagnant pour pagination

// Modèle
const Conversation = model("Conversation", conversationSchema);

export default Conversation;
