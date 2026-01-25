
import QRCode from 'qrcode';
import User from '../models/User.js';
import Relation from '../models/Relation.js'; 


// 1. GÉNÉRER QR CODE POUR RECHERCHE AUTOMATIQUE

export const generateQRCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('username profilePicture');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    // URL qui déclenchera la recherche AUTOMATIQUE
    // Format: http://localhost:5173/qr-scan?username=nomdutilisateur
    const searchUrl = `${process.env.CLIENT_URL}/qr-scan?username=${encodeURIComponent(user.username)}`;
    
    // Générer QR code
    const qrCodeData = await QRCode.toDataURL(searchUrl);

    return res.status(200).json({
      success: true,
      qrCode: qrCodeData,
      searchUrl: searchUrl,
      username: user.username,
      profilePicture: user.profilePicture,
      message: 'QR code généré. Scannez-le pour rechercher cet utilisateur.'
    });

  } catch (error) {
    console.error('Erreur génération QR code:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la génération du QR code' 
    });
  }
};

// ========================================
// 2. SCANNER UN QR CODE ET RENVOYER LES RÉSULTATS
// ========================================
export const scanQRCode = async (req, res) => {
  try {
    const { qrContent } = req.body;
    
    if (!qrContent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contenu du QR code requis' 
      });
    }

    console.log("QR code scanné:", qrContent);
    
    // Extraire le username de l'URL
    let username = '';
    
    // Si c'est une URL avec paramètre username
    if (qrContent.includes('username=')) {
      try {
        const url = new URL(qrContent);
        username = url.searchParams.get('username') || '';
      } catch (e) {
        // Si ce n'est pas une URL valide, essayer de l'extraire manuellement
        const match = qrContent.match(/username=([^&]+)/);
        username = match ? decodeURIComponent(match[1]) : qrContent;
      }
    } 
    // Sinon, traiter comme un username direct
    else {
      username = qrContent;
    }

    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucun nom d\'utilisateur trouvé dans le QR code' 
      });
    }

    console.log("Username extrait:", username);
    
    // UTILISER VOTRE FONCTION DE RECHERCHE EXISTANTE
    const users = await User.find({
      username: { $regex: `^${username}$`, $options: 'i' }, // Recherche exacte
      _id: { $ne: req.user.id } // Exclure l'utilisateur connecté
    }).select('username profilePicture status _id createdAt');

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    const user = users[0];
    
    // Vérifier la relation (comme dans getUserProfile)
    const relation = await Relation.findOne({
      $or: [
        { userId: req.user.id, contactId: user._id },
        { userId: user._id, contactId: req.user.id }
      ]
    });

    // RENVOYER EXACTEMENT LE MÊME FORMAT QUE searchUsers
    return res.status(200).json({
      success: true,
      // Même format que votre recherche normale
      users: [{
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        status: user.status,
        createdAt: user.createdAt
      }],
      // Informations supplémentaires (comme dans getUserProfile)
      profileInfo: {
        user: {
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
          status: user.status,
          createdAt: user.createdAt
        },
        relation: relation ? relation.status : null,
        relationId: relation ? relation._id : null
      },
      message: 'QR code scanné avec succès'
    });

  } catch (error) {
    console.error('Erreur scan QR code:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du scan du QR code' 
    });
  }
};