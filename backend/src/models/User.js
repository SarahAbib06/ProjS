// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true }, // OBLIGATOIRE
    dateOfBirth: { type: Date }, // 🆕 AJOUTÉ depuis votre version
    profilePicture: { type: String,
       default: "https://res.cloudinary.com/dv9oqjulh/image/upload/v1764324539/photo_de_profil_par_defaut_j3qm1p.png" },
    qrCode: { type: String },
    status: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline",
    },

activeSessions: [
  {
    socketId: { type: String, required: false },
    deviceInfo: {  // 🆕 Nouveau champ structuré
      type: {
        type: String,  // 'desktop', 'mobile', 'tablet'
        default: 'desktop'
      },
      platform: {
        type: String,  // 'web', 'android', 'ios', 'windows', 'macos'
        default: 'web'
      },
      browser: String,  // 'chrome', 'firefox', 'safari'
      os: String,       // 'Windows', 'macOS', 'Android', 'iOS'
      userAgent: String // User agent complet
    },
    ipAddress: { type: String },
    connectedAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
  },
],

    // 🆕 PRÉFÉRENCES NOTIFICATIONS (AJOUTÉ depuis votre version)
    notificationPreferences: {
      pushEnabled: { type: Boolean, default: true },
      soundEnabled: { type: Boolean, default: true },
      quietHours: {
        enabled: { type: Boolean, default: false },

        start: { type: String, default: "23:00" }, // Format HH:mm
        end: { type: String, default: "07:00" },
      },
    },

    // Sécurité (DEPUIS la version GitHub)
    failedLoginAttempts: { type: Number, default: 0 },
    lastFailedAttempt: { type: Date },
    lockedUntil: { type: Date, default: null },
    knownDevices: { type: [String], default: [] },

    createdAt: { type: Date, default: Date.now },
    lastSeen: { type: Date },
  },
  { timestamps: true } // 🆕 GARDÉ depuis GitHub
);

// 🆕 INDEXES POUR PERFORMANCE (AJOUTÉ depuis votre version)
userSchema.index({ "activeSessions.socketId": 1 });
userSchema.index({ status: 1, lastSeen: -1 });
userSchema.index({ "activeSessions.lastActivity": -1 });

// MÉTHODE DE COMPARAISON (DEPUIS GitHub)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// MÉTHODES SÉCURITÉ (DEPUIS GitHub)
userSchema.methods.addKnownDevice = function (deviceId) {
  if (!this.knownDevices.includes(deviceId)) {
    this.knownDevices.push(deviceId);
  }
};

userSchema.methods.resetLoginAttempts = function () {
  this.failedLoginAttempts = 0;
  this.lastFailedAttempt = null;
  this.lockedUntil = null;
};

export default mongoose.model("User", userSchema);
