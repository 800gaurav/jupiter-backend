// models/CommissionHistory.js
import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;


const commissionHistorySchema = new Schema({
    fromUser: { type: Types.ObjectId, ref: 'User', required: true },  // who purchased/activated
    toUser: { type: Types.ObjectId, ref: 'User', required: true },  // who earned
    amount: { type: Number, required: true },                       // commission ₹
    type: { type: String, enum: ['direct', 'level'], required: true },
    plan: { type: String, enum: ['A', 'B'], required: true },
    createdAt: { type: Date, default: Date.now }
});

export default model('CommissionHistory', commissionHistorySchema);
