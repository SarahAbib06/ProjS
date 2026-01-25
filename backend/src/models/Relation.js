import mongoose from 'mongoose';

const relationtSchema = new mongoose.Schema({
contactId: {type: mongoose.Schema.Types.ObjectId,ref: 'User',required: true
},
userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

status: { type: String, enum: ["accepted", "pending", "blocked"], default: "pending" },
addedAt: { type: Date, default: Date.now }
});


  export default mongoose.model("Relation", relationtSchema);