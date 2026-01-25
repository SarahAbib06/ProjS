import Participants from '../models/Participants.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

export const participantController = {
  // 🎯 AJOUTER UN PARTICIPANT À UNE CONVERSATION
  addParticipant: async (Id_User, Id_Conversation, Role = 'membre') => {
    const participant = new Participants({
      Id_User: Id_User,
      Id_Conversation: Id_Conversation,
      Role: Role,
      joinedAt: new Date()
    });

    const savedParticipant = await participant.save();
    console.log('✅ Participant ajouté:', savedParticipant._id);
    return savedParticipant;
  },

  // 🎯 AJOUTER PLUSIEURS PARTICIPANTS (pour nouvelles conversations)
  addParticipants: async (participantsData) => {
    const participants = await Participants.create(participantsData);
    console.log('✅ Participants créés:', participants.length);
    return participants;
  },

  // 🎯 SUPPRIMER UN PARTICIPANT
  removeParticipant: async (Id_User, Id_Conversation) => {
    const result = await Participants.deleteOne({
      Id_User: Id_User,
      Id_Conversation: Id_Conversation
    });
    console.log('✅ Participant supprimé');
    return result;
  },

  // 🎯 CHANGER LE RÔLE D'UN PARTICIPANT
  updateParticipantRole: async (Id_User, Id_Conversation, newRole) => {
    const participant = await Participants.findOneAndUpdate(
      { Id_User: Id_User, Id_Conversation: Id_Conversation },
      { Role: newRole },
      { new: true }
    );
    console.log('✅ Rôle mis à jour:', newRole);
    return participant;
  },

  // 🎯 RÉCUPÉRER LES PARTICIPANTS D'UNE CONVERSATION
  getConversationParticipants: async (Id_Conversation) => {
    return await Participants.find({ Id_Conversation: Id_Conversation })
      .populate('Id_User', 'username email profilePicture');
  },

  // 🎯 RÉCUPÉRER LES CONVERSATIONS D'UN USER
  getUserConversations: async (Id_User) => {
    return await Participants.find({ Id_User: Id_User })
      .populate('Id_Conversation');
  },

  // 🎯 VÉRIFIER SI UN USER EST DANS UNE CONVERSATION
  isUserInConversation: async (Id_User, Id_Conversation) => {
    const participant = await Participants.findOne({
      Id_User: Id_User,
      Id_Conversation: Id_Conversation
    });
    return !!participant;
  },

// 🎯 NETTOYAGE DES PARTICIPANTS ORPHELINS (VERSION FINALE)
cleanupOrphanParticipants: async () => {
  try {
    console.log('🔧 Début du nettoyage des participants orphelins...');
    
    // 🎯 RÉCUPÉRER TOUS LES PARTICIPANTS
    const allParticipants = await Participants.find({});
    console.log(`📊 ${allParticipants.length} participants au total`);
    
    let orphanCount = 0;
    
    // 🎯 VÉRIFIER CHAQUE PARTICIPANT
    for (let participant of allParticipants) {
      try {
        // Vérifier si l'user existe dans la collection User
        const userExists = await User.findById(participant.Id_User);
        
        if (!userExists) {
          console.log(`🗑️  Participant orphelin trouvé:`, {
            participantId: participant._id,
            userId: participant.Id_User,
            conversationId: participant.Id_Conversation
          });
          
          // Supprimer le participant orphelin
          await Participants.findByIdAndDelete(participant._id);
          orphanCount++;
        }
      } catch (error) {
        // En cas d'erreur (ID invalide, etc.)
        console.log(`❌ Référence cassée - suppression:`, participant._id);
        await Participants.findByIdAndDelete(participant._id);
        orphanCount++;
      }
    }
    
    console.log(`✅ ${orphanCount} participants orphelins supprimés`);
    return orphanCount;
    
  } catch (error) {
    console.error('❌ Erreur nettoyage participants orphelins:', error);
    throw error;
  }
},
};