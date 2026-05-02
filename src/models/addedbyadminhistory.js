import mongoose from 'mongoose';

const adminUpdateHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String },
  field: { type: String, required: true },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('AdminUpdateHistory', adminUpdateHistorySchema);
