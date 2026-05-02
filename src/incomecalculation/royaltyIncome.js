// royaltyIncome.utils.js
// import { UserModel } from "../models/user.model.js";

// const ROYALTY_TIERS = [
//   { business: 5000, reward: 5 },
//   { business: 12000, reward: 10 },
//   { business: 25000, reward: 20 },
//   { business: 40000, reward: 40 },
//   { business: 80000, reward: 100 },
//   { business: 120000, reward: 150 },
//   { business: 240000, reward: 350 },
//   { business: 480000, reward: 800 },
//   { business: 960000, reward: 1700 },
//   { business: 1500000, reward: 4000 },
// ];


//  const calculateRoyaltyIncome = async (userId) => {
//   const user = await UserModel.findById(userId).populate("downline");
//   if (!user || user.downline.length === 0) return;

//   const legBusinessMap = new Map();

//   // Group team members by direct leg and accumulate business
//   for (const legUser of user.downline) {
//     const legRoot = legUser.referrer.toString();
//     if (!legBusinessMap.has(legRoot)) legBusinessMap.set(legRoot, 0);
//     legBusinessMap.set(
//       legRoot,
//       legBusinessMap.get(legRoot) + (legUser.totalInvested || 0)
//     );
//   }

//   const legs = Array.from(legBusinessMap.entries());
//   if (legs.length === 0) return;

//   // Sort by business desc
//   legs.sort((a, b) => b[1] - a[1]);

//   const strongLegBusiness = legs[0][1];
//   const otherLegsBusiness = legs.slice(1).reduce((sum, [, amt]) => sum + amt, 0);
//   const totalBusiness = strongLegBusiness + otherLegsBusiness;

//   if (totalBusiness === 0) return;

//   const ratio50 = totalBusiness * 0.5;
//   if (strongLegBusiness < ratio50 || otherLegsBusiness < ratio50) return; // Condition not met

//   // Check highest eligible royalty tier
//   let eligibleReward = 0;
//   for (const tier of ROYALTY_TIERS) {
//     if (totalBusiness >= tier.business) eligibleReward = tier.reward;
//     else break;
//   }

//   if (!eligibleReward) return;

//   // Check if reward already given this week (optional: store with date key)
//   const lastRoyalty = user.royaltyHistory?.find((r) => r.business === totalBusiness);
//   if (lastRoyalty) return;

//   user.walletBalance += eligibleReward;
//   user.todayIncome += eligibleReward;
//   user.totalProfitEarned += eligibleReward;
//   user.royalyIncome += eligibleReward;
//   user.royaltyHistory = [
//     ...(user.royaltyHistory || []),
//     {
//       business: totalBusiness,
//       strongLeg: strongLegBusiness,
//       otherLeg: otherLegsBusiness,
//       reward: eligibleReward,
//       date: new Date(),
//     },
//   ];

//   await user.save();
// };


// export const calculateRoyaltyIncomeForAllUsers = async () => {
//   const users = await UserModel.find({ isActivated: true });

//   for (const user of users) {
//     try {
//       await calculateRoyaltyIncome(user._id);
//     } catch (error) {
//       console.error(`Royalty income error for user ${user.userId}:`, error.message);
//     }
//   }
// };



import { getAvailableIncome } from "../helper/capping.js";
import { UserModel } from "../models/user.model.js";

const ROYALTY_TIERS = [
  { business: 5000, reward: 5 },
  { business: 10000, reward: 10 },
  { business: 15000, reward: 15 },
  { business: 30000, reward: 30 },
  { business: 50000, reward: 50 },
  { business: 100000, reward: 100 },
];

// ✅ Get Downline Business Per Leg
const getDownlinePerLeg = async (userId) => {
  const result = new Map();
  const firstLevel = await UserModel.find({ referrer: userId });

  for (const legUser of firstLevel) {
    let queue = [legUser._id];
    let total = 0;

    while (queue.length) {
      const current = queue.shift();
      const user = await UserModel.findById(current);
      total += user?.totalInvested || 0;

      const referrals = await UserModel.find({ referrer: current }, "_id");
      queue.push(...referrals.map(u => u._id));
    }

    result.set(legUser._id.toString(), total);
  }

  return result;
};

// ✅ Main Function
export const calculateRoyaltyIncome = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) return;

    const legMap = await getDownlinePerLeg(userId);
    console.log("all user ofleg", legMap)
    const legs = Array.from(legMap.entries());
    if (!legs.length) return;

    // Sort legs by business descending
    legs.sort((a, b) => b[1] - a[1]);
    const strongLegBusiness = legs[0][1];
    const otherLegsBusiness = legs.slice(1).reduce((sum, [, b]) => sum + b, 0);
    const totalBusiness = strongLegBusiness + otherLegsBusiness;

    const royaltyHistory = user.royaltyHistory || [];

    // 🔍 Find highest eligible tier
    const eligibleTier = [...ROYALTY_TIERS].reverse().find((tier) => {
      const minEach = tier.business * 0.5;
      return strongLegBusiness >= minEach && otherLegsBusiness >= minEach;
    });

    if (eligibleTier) {

       // ✅ Apply working income capping
  const availableIncome = await getAvailableIncome(userId, "working");
  if (availableIncome <= 0) return; // cap reached

  const addableReward = Math.min(eligibleTier.reward, availableIncome);

      // Reward the tier again every time it's eligible (no check for duplicates)
      user.walletBalance += addableReward;
      user.royalyIncome += addableReward;

      royaltyHistory.push({
        business: eligibleTier.business,
        strongLeg: strongLegBusiness,
        otherLeg: otherLegsBusiness,
        reward: addableReward,
        date: new Date(),
      });

      console.log(
        `✅ Royalty Rewarded: ${user.userId} => $${addableReward} for ${eligibleTier.business} business`
      );
    }

    user.royaltyHistory = royaltyHistory;
    await user.save();
  } catch (error) {
    console.error(`❌ Royalty error for user ${userId}:`, error.message);
  }
};


// ✅ For All Users
export const calculateRoyaltyIncomeForAllUsers = async () => {
  try {
    const users = await UserModel.find({ isActivated: true });

    for (const user of users) {
      await calculateRoyaltyIncome(user._id);
    }
  } catch (err) {
    console.error("❌ Error in royalty distribution:", err.message);
  }
};
