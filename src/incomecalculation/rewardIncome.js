// services/rankReward.service.js
import mongoose from "mongoose";
import { UserModel } from "../models/user.model.js";
import { getDownlineByLevels } from "../utils/downlineMember.js";
import { errorResponse, successResponse } from "../utils/api-response.js";
import { getAvailableIncome } from "../helper/capping.js";


const REWARD_TIERS = [
  { threshold: 10000, reward: 50 },
  { threshold: 25000, reward: 100 },
  { threshold: 50000, reward: 200 },
  { threshold: 100000, reward: 500 },
  { threshold: 200000, reward: 1200 },
  { threshold: 500000, reward: 2500 },
];

const BUSINESS_FIELD = "totalInvested"; // <--- change if you use different field

export const evaluateAndApplyRankReward = async (userId) => {


  // load user
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  // get direct referrals (legs)
  const directRefs = await UserModel.find({ referrer: user._id })
    .select(`${BUSINESS_FIELD} name userId`)
    .lean();

  if (!directRefs || directRefs.length === 0) {
    return { awarded: false, reason: "no_direct_legs" };
  }

  // For each direct referral, compute business under that leg (including that ref's own business)
  const legs = [];
  for (const ref of directRefs) {
    // get downline for this leg (use your existing helper)
    const downline = await getDownlineByLevels(ref._id, 100, false);
    // sum businesses: include ref itself + every user returned in levels
    let sum = (ref[BUSINESS_FIELD] || 0);
    for (const lvl in downline) {
      const arr = downline[lvl];
      for (const u of arr) {
        sum += (u[BUSINESS_FIELD] || 0);
      }
    }
    legs.push({ userId: ref.userId, name: ref.name, business: sum });
  }

  // sort legs desc by business
  legs.sort((a, b) => b.business - a.business);

  const top1 = legs[0]?.business || 0;
  const top2 = legs[1]?.business || 0;
  const top3 = legs[2]?.business || 0;

  const totalTeamBusiness = legs.reduce((s, l) => s + (l.business || 0), 0);

  // apply 40% / 30% / 30% caps
  const cap1 = Math.min(top1, totalTeamBusiness * 0.4);
  const cap2 = Math.min(top2, totalTeamBusiness * 0.3);
  const cap3 = Math.min(top3, totalTeamBusiness * 0.3);

  const eligibleBusiness = cap1 + cap2 + cap3;

  // find highest reward tier eligible
  let highestIdx = -1;
  for (let i = 0; i < REWARD_TIERS.length; i++) {
    if (eligibleBusiness >= REWARD_TIERS[i].threshold) highestIdx = i;
  }
  if (highestIdx === -1) {
    return { awarded: false, reason: "not_eligible", eligibleBusiness, caps: { cap1, cap2, cap3 } };
  }

  
  console.log("🔍 Legs =>", legs);
console.log("top1", top1, "top2", top2, "top3", top3, "total", totalTeamBusiness);
console.log("caps =>", { cap1, cap2, cap3 }, "eligibleBusiness", eligibleBusiness);

  // Check claimed tiers
  user.claimedRankRewards = user.claimedRankRewards || [];
  const highestThreshold = REWARD_TIERS[highestIdx].threshold;
  if (user.claimedRankRewards.includes(highestThreshold)) {
    return { awarded: false, reason: "already_claimed", threshold: highestThreshold };
  }

  // Award: choose highest unclaimed tier (supersede lower tiers)
  const rewardAmount = REWARD_TIERS[highestIdx].reward;

   // ✅ Check working cap using helper
  const available = await getAvailableIncome(user._id, "working");
  if (available <= 0) {
    return { awarded: false, reason: "working_cap_reached" };
  }

  const addableReward = Math.min(rewardAmount, available);

  // update user's reward income and history
  user.rankRewardIncome = (user.rankRewardIncome || 0) + addableReward;
  user.rankRewardHistory = user.rankRewardHistory || [];
  user.rankRewardHistory.push({
    milestone: highestThreshold,
    reward: rewardAmount,
    business: eligibleBusiness,
    strongLeg: cap1,
    secondLeg: cap2,
    thirdLeg: cap3,
    legs: legs.slice(0, 3).map(l => ({ userId: l.userId, business: l.business })),
    date: new Date()
  });

  // mark as claimed all tiers up to highestIdx (so lower tiers won't be paid later)
  for (let i = 0; i <= highestIdx; i++) {
    const t = REWARD_TIERS[i].threshold;
    if (!user.claimedRankRewards.includes(t)) user.claimedRankRewards.push(t);
  }

  await user.save();

  return {
    awarded: true,
    reward: addableReward,
    milestone: highestThreshold,
    eligibleBusiness,
    caps: { cap1, cap2, cap3 },
    legs: legs.slice(0, 3)
  };
};

export const evaluateAllUsersRankRewards = async () => {
  try {
    const users = await UserModel.find({}, "_id userId name"); // bas _id lena kaafi hai
    console.log(`🔄 Processing ${users.length} users for rank rewards...`);

    let results = [];
    for (const user of users) {
      try {
        const res = await evaluateAndApplyRankReward(user._id);
        results.push({ userId: user.userId, name: user.name, ...res });
      } catch (err) {
        console.error(`❌ Error processing user ${user.userId}:`, err.message);
        results.push({ userId: user.userId, name: user.name, error: err.message });
      }
    }

    console.log("✅ Rank reward evaluation complete.");
    return results;
  } catch (err) {
    console.error("🚨 Failed to evaluate all users:", err);
    throw err;
  }
};

export const rankRewardHistory = async (req, res) => {
  try {
    const isAdmin = req.currentUser.role === "admin"; // assuming you have a role field
    let users;

    if (isAdmin) {
      const { userId } = req.query;

      if (userId) {
        const user = await UserModel.findById(userId)
          .select("rankRewardHistory rankRewardIncome name userId")
          .lean();
        if (!user) return errorResponse(res, "User not found", 404);

        return successResponse(res, "User rank reward history fetched", user);
      }

      // No userId → fetch all users
      users = await UserModel.find()
        .select("rankRewardHistory rankRewardIncome name userId")
        .lean();

      return successResponse(res, "All users rank reward history fetched", users);
    } else {
      // Regular user → fetch own
      const userId = req.currentUser._id;
      const user = await UserModel.findById(userId)
        .select("rankRewardHistory rankRewardIncome")
        .lean();

      if (!user) return errorResponse(res, "User not found", 404);

      return successResponse(res, "Your rank reward history fetched", user);
    }
  } catch (err) {
    console.error(err);
    return errorResponse(res, "Server error");
  }
};