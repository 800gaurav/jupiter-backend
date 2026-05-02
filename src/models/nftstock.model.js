import mongoose from "mongoose";

const nftSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  
  },
  { timestamps: true }
);

const NftModel = mongoose.model("NFT", nftSchema);
export { NftModel };

