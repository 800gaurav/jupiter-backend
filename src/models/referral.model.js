import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    refBy: {
      type: mongoose.Types.ObjectId,
      ref: "User"
    },
    refTo: {
      type: mongoose.Types.ObjectId,
      ref: "User"
    },
    level: {
      type: Number,
      max: 10
    }
  },
  {
    timestamps: true
  }
)

const ReferralModel = mongoose.model('Referral', referralSchema)

export { ReferralModel }