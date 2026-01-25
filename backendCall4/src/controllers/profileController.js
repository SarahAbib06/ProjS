// controllers/profileController.js
import User from "../models/User.js";

// Mettre à jour le username 
export const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    if (!username) {
      return res.status(400).json({
        message: "Le nom d'utilisateur est requis."
      });
    }

    
    //  Vérification REGEX
    
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;

    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message:
          "Le nom d'utilisateur ne doit contenir que des lettres, chiffres, '.', '-' ou '_' et aucun espace."
      });
    }

    
    //  Normalisation du username
    
    let cleanUsername = username
      .normalize("NFKD")                    // normalise et retire accents
      .replace(/\p{Diacritic}/gu, "")       // supprime accents restants
      .trim()                               // enlève espaces extérieurs
      .toLowerCase()                        // casse uniforme
      .replace(/[\s\u00A0]/g, "");          // supprime TOUT type d'espace

    
    //  Vérification longueur
   
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({
        message: "Le nom d'utilisateur doit contenir entre 3 et 30 caractères."
      });
    }

    
    //  Vérification unicité
    // (exclut l'utilisateur actuel)
    
    const existingUser = await User.findOne({
      username: cleanUsername,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Ce nom d'utilisateur est déjà pris."
      });
    }

   
    //  Mise à jour en base
  
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username: cleanUsername },
      { new: true }
    );

    res.json({
      message: "Nom d'utilisateur mis à jour avec succès",
      user: updatedUser
    });

  } catch (error) {
    console.error("Erreur mise à jour username:", error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour du nom d'utilisateur"
    });
  }
};




// Récupérer les infos du profil

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-passwordHash");

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Erreur récupération profil:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération du profil"
    });
  }
};
