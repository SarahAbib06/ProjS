import mongoose from 'mongoose';

const participantsSchema = new mongoose.Schema({
  Id_User: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // 🆕 CORRIGÉ : 'Users' → 'User'
    required: true
  },
  Id_Conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  Role: {
    type: String,
    enum: ['admin', 'membre'],
    default: 'membre'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Participants", participantsSchema);