import mongoose from 'mongoose'

const depositSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  network: { type: String, enum: ['BEP20', 'TRC20'] },
  txHash: String,
  status: { type: String, enum: ['pending', 'confirmed'], default: 'pending' }
}, { timestamps: true })

export default mongoose.model('Deposit', depositSchema)