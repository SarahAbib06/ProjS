// controllers/relationsController.js
import Relation from '../models/Relation.js';
import User from '../models/User.js';

export const getContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Cherche toutes les relations "accepted" où l'utilisateur est impliqué
    const relations = await Relation.find({
      $or: [
        { userId: userId, status: 'accepted' },
        { contactId: userId, status: 'accepted' }
      ]
    })
    .populate('userId', 'username profilePicture status')
    .populate('contactId', 'username profilePicture status');

    // Formate les contacts : pour chaque relation, prend l'autre utilisateur (pas moi)
    const contacts = relations
  .filter(relation => {
    return relation.userId && relation.contactId;  // ← NOUVEAU : on élimine les relations cassées
  })
  .map(relation => {
    const isUserInitiator = relation.userId._id.toString() === userId;  // ← renommé pour plus de clarté
    const contact = isUserInitiator ? relation.contactId : relation.userId;

    return {
      id: contact._id,
      _id: contact._id,
      username: contact.username,
      profilePicture: contact.profilePicture || null,
      status: contact.status || 'offline',
      relationId: relation._id,
      addedAt: relation.addedAt || relation.createdAt  // ← petit bonus au cas où addedAt n'existe pas
    };
  });

   

    res.json(contacts); // Retourne directement le tableau, pas besoin de wrapper

  } catch (error) {
    console.error('❌ Erreur récupération contacts:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des contacts' 
    });
  }
};