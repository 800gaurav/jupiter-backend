import mongoose from 'mongoose'

const adminEarningSchema = new mongoose.Schema({
  userId: { type: String},
  toUserId: { type: String },
  fromUserId: { type: String},
  amount: { type: Number, required: true },
  source: { type: String, enum: ['withdrawal', 'walletToFund'], required: true },
  coin: { type: String, enum: ['TRC20', 'BEP20'], required: false },
  note: { type: String },
  createdAt: { type: Date, default: Date.now }
})

export const AdminEarningModel = mongoose.model('AdminEarning', adminEarningSchema)
