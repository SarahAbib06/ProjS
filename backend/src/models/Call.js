import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true
},

callerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

callType: { type: String, enum: ["audio", "video"], required: true },
startTime: { type: Date, default: Date.now },
endTime: { type: Date,default: null},
duration: { type: Number },
status: { type: String, enum: ['missed', 'rejected', 'ongoing', 'completed'], default: 'ongoing' }
});
export default mongoose.model("Call", callSchema);
