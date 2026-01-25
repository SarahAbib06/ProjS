// src/config/db.js
import "dotenv/config"; // ✅ Ajoutez cette ligne
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("🔄 Tentative de connexion à MongoDB...");
    console.log("URI:", process.env.MONGODB_URI?.substring(0, 30) + "...");

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "owlydb",
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Code:", err.code);
    process.exit(1);
  }
};

export default connectDB;
