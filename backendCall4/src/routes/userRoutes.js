import express from 'express';
import User from '../models/User.js';
import { protact } from '../middleware/authen.js';

const router = express.Router();

// 🆕 METTRE À JOUR LES PRÉFÉRENCES NOTIFICATIONS
router.put('/notification-preferences', protact, async (req, res) => {
  try {
    const userId = req.user._id;
    const { pushEnabled } = req.body;

    await User.findByIdAndUpdate(userId, {
      $set: {
        'notificationPreferences.pushEnabled': pushEnabled
      }
    });

    console.log(`✅ Préférences mises à jour - pushEnabled: ${pushEnabled} pour user ${userId}`);
    
    res.json({ 
      success: true, 
      message: `Notifications ${pushEnabled ? 'activées' : 'désactivées'}`,
      pushEnabled: pushEnabled
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour préférences:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 🆕 RÉCUPÉRER LES PRÉFÉRENCES
router.get('/notification-preferences', protact, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    res.json({
      success: true,
      pushEnabled: user.notificationPreferences?.pushEnabled ?? true
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
// 🆕 ROUTE RECHERCHE UTILISATEURS
router.get('/search', protact, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Le terme de recherche doit contenir au moins 2 caractères'
            });
        }

        console.log('🔍 Recherche utilisateurs:', q);

        // Recherche dans la base de données
        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } }, // Recherche insensible à la casse
                { email: { $regex: q, $options: 'i' } }
            ],
            _id: { $ne: req.user._id } // Exclure l'utilisateur connecté
        })
        .select('username email profilePicture status') // Sélectionner seulement les champs nécessaires
        .limit(10); // Limiter à 10 résultats

        console.log(`✅ ${users.length} utilisateurs trouvés`);

        res.json({
            success: true,
            users: users,
            count: users.length
        });

    } catch (error) {
        console.error('❌ Erreur recherche utilisateurs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recherche',
            error: error.message
        });
    }
});

export default router;