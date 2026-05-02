import mongoose from 'mongoose'

const transferHistorySchema = new mongoose.Schema({
  fromUserId: {
    type: String,
    required: true
  },
  toUserId: {
    type: String,
    required: true
  },
  from: {
    type: String,
    enum: ['walletBalance', 'fundBalance'],
    required: true
  },
  to: {
    type: String,
    enum: ['walletBalance', 'totalInvested', 'fundBalance'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  receivedAmount: {
    type: Number,
    required: true
  },
  fee: {
    type: Number,
    required: true
  }
}, { timestamps: true })

export const TransferHistoryModel = mongoose.model('TransferHistory', transferHistorySchema)
