// controllers/uploadController.js
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";

// Multer → stockage en mémoire (obligatoire pour Cloudinary)
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont autorisées"), false);
    }
  },
}).single("profile");


// Upload vers Cloudinary
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier uploadé" });
    }

    // Debug: Vérifier ce qui est dans req.user
    console.log("User dans la requête:", req.user);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const userId = req.user.id;

    // Récupérer l'utilisateur pour avoir l'ancienne image
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Supprimer l'ancienne image de Cloudinary si elle existe
    if (user.profilePictureId) {
      try {
        await cloudinary.uploader.destroy(user.profilePictureId);
        console.log("Ancienne image supprimée:", user.profilePictureId);
      } catch (cloudinaryError) {
        console.log("Erreur suppression ancienne image:", cloudinaryError);
        // Continuer quand même l'upload
      }
    }

    // Fonction utilitaire : convertit le buffer en stream → Cloudinary
    const uploadToCloudinary = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "profile_pictures",
            transformation: {
              width: 600,
              height: 600,
              crop: "fill"
            },
          },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await uploadToCloudinary(req.file.buffer);

    // Mise à jour de l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePicture: result.secure_url,
        profilePictureId: result.public_id,
      },
      { new: true }
    ).select('-password'); // Exclure le mot de passe de la réponse

    return res.status(200).json({
      message: "Photo uploadée avec succès",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erreur Cloudinary:", error);
    return res.status(500).json({ message: error.message });
  }
};
// Supprimer la photo de profil
export const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.profilePictureId) {
      await cloudinary.uploader.destroy(user.profilePictureId);
      console.log("Image supprimée de Cloudinary:", user.profilePictureId);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePicture: "https://res.cloudinary.com/dv9oqjulh/image/upload/v1764324539/photo_de_profil_par_defaut_j3qm1p.png",
        profilePictureId: null,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Photo supprimée avec succès",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Erreur suppression:", error);
    return res.status(500).json({ message: error.message });
  }
};