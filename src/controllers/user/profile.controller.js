import { UserModel } from "../../models/user.model.js"
import { buildTree } from "../../utils/build-tree.js";
import { errorResponse, successResponse } from "../../utils/api-response.js"
import { countNodes } from "../../utils/count-referrals.js";
import PLANS from "../../config/plans.js";
import CommissionHistory from '../../models/comissionhistory.js'
import mongoose from "mongoose";
import { calculateDomesticIncome, calculateDomesticIncomeForAllUsers } from "../../incomecalculation/domesticincome.js";
import { calculateRoyaltyIncome, calculateRoyaltyIncomeForAllUsers } from "../../incomecalculation/royaltyIncome.js";
import { calculateDailyIncome } from "../../incomecalculation/retunonequity.js";
import { resetDailyIncomes } from "../../helper/resetdailyincome.js";
import { duplicateroi } from "../../incomecalculation/duplicateroi.js";
import { removeDuplicateDomesticIncome } from "../../incomecalculation/removedomesticduplicate.js";
import { recalculateTotalIncomeForAllUsers } from "../../incomecalculation/updatebalance.js";
import { updateTodayIncomeFromHistory } from "../../incomecalculation/updatetodayincome.js";



const profileController = {
  getLoggedinUserProfile: async (req, res) => {
    const user = await UserModel.findById(req.currentUser._id).select("-password");
    if (!user) return errorResponse(res, "User not found", 404);
    successResponse(res, "User data fetched successfully", user);
  },
  // 
  getReferralTree: async (req, res) => {
    const user = await UserModel.findById(req.currentUser._id).select("-password");
    if (!user) return errorResponse(res, "User not found", 404);

    const tree = await buildTree(user._id);
    successResponse(res, "Referral Tree fetched successfully", tree); 
  },

  userdashboarddetails: async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user with only needed fields
    const user = await UserModel.findOne({ userId }, '_id name email createdAt isActivated totalDomesticIncome royalyIncome fundBalance rankRewardIncome walletBalance totalInvested proBonusIncome roiIncome royalyIncome totalDomesticIncome todayIncome referralBonus').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch direct referrals in parallel
    const [directReferrals, directActiveReferrals] = await Promise.all([
      UserModel.countDocuments({ referrer: user._id }),
      UserModel.countDocuments({ referrer: user._id, isActivated: true }),
    ]);

    // Initialize
    let totalTeamBusiness = 0;
    let totalDownlineMembers = 0;
    let totalActiveDownlineMembers = 0;

    let currentLevelUserIds = [user._id];

    // Combine both business and downline logic into a single loop
    for (let level = 1; level <= 20; level++) {
      const downlineUsers = await UserModel.find(
        { referrer: { $in: currentLevelUserIds } },
        '_id totalInvested isActivated'
      ).lean();

      if (downlineUsers.length === 0) break;

      // Add business for this level
      totalTeamBusiness += downlineUsers.reduce(
        (sum, u) => sum + (u.totalInvested || 0),
        0
      );

      // For level > 1, calculate downline members
      if (level > 1) {
        totalDownlineMembers += downlineUsers.length;
        totalActiveDownlineMembers += downlineUsers.filter(u => u.isActivated).length;
      }

      currentLevelUserIds = downlineUsers.map(u => u._id);
    }

    const totalTeamMembers = directReferrals + totalDownlineMembers;
    const totalActiveTeamMembers = directActiveReferrals + totalActiveDownlineMembers;

    const registrationIncome = 5;
    const nonWorkingIncome = registrationIncome + user.roiIncome;
    const workingIncome = user.proBonusIncome + user.totalDomesticIncome + user.royalyIncome + user.rankRewardIncome;

    const dashboardData = {
      username: user.name,
      email: user.email,
      createdAt: user.createdAt,
      isActivated: user.isActivated,
      fundBalance: user.fundBalance,
      walletBalance: user.walletBalance,
      totalInvested: user.totalInvested,
      rankRewardIncome: user.rankRewardIncome,
      totalTeamBusiness,
      royalyIncome: user.royalyIncome,
      totalDomesticIncome: user.totalDomesticIncome,
      directReferrals,
      directActiveReferrals,
      totalTeamMembers,
      workingIncome,
      nonWorkingIncome,
      totalActiveTeamMembers,
      proBonusIncome: user.proBonusIncome,
      roiIncome: user.roiIncome,
      royaltyIncome: user.royalyIncome,
      domesticIncome: user.totalDomesticIncome,
      todayIncome: user.todayIncome,
      totalProfitEarned:
        (user.proBonusIncome || 0) +
        (user.roiIncome || 0) +
        (user.royalyIncome || 0) +
        (user.totalDomesticIncome || 0) + 
        (user.rankRewardIncome || 0)
    };

    return res.status(200).json({
      success: true,
      data: dashboardData,
    });

  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
  },

  userDirectrefers: async (req, res) => {
  try {
    const {userId} = req.params;
    const user = await UserModel.findOne({userId}).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Correct variable name
    const directReferrals = await UserModel.find({ referrer: user._id }).select("-password");

    res.status(200).json({
      success: true,
      message: "Direct referrals fetched successfully",
      data: directReferrals,
    });

  } catch (error) {
    console.error("Error fetching direct referrals:", error);
    res.status(500).json({ success: false, error: error.message });
  }
},


// mainTofundtransfer: async (req, res) =>{
//   try {
//     const { userId } = req.params;
//     const { amount, txnpass } = req.body;

//     // Input validation
//     if (!amount || !txnpass) {
//       return res.status(400).json({ success: false, message: "Amount and txnpass are required." });
//     }

//     const user = await UserModel.findOne({userId});

//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found." });
//     }

//     // Compare txnpass (no bcrypt)
//     if (user.txnpass !== txnpass) {
//       return res.status(401).json({ success: false, message: "Invalid transaction password." });
//     }

//     if (user.fundBalance < amount) {
//       return res.status(400).json({ success: false, message: "Insufficient main balance." });
//     }

//     // Transfer
//     user.fundBalance -= amount;
//     user.walletBalance += amount;

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: "Fund transferred successfully from Main to Wallet.",
//       walletBalance: user.walletBalance,
//       fundBalance: user.fundBalance,
//     });

//   } catch (error) {
//     console.error("Transfer error:", error);
//     return res.status(500).json({ success: false, message: "Internal server error." });
//   }
// },



probonusIncomehistory: async (req, res) =>{
   try {
    // const userId = req.currentUser._id;  
    const {userId} = req.params

    const user = await UserModel.findOne({userId}).select("proBonusHistory");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Return exactly what you need: raw ObjectId + amounts + date
    const simplifiedHistory = user.proBonusHistory.map(entry => ({
      fromUser: entry.fromUser, 
      baseAmount: entry.baseAmount,
      amount: entry.amount,
      date: entry.date,
    }));

    res.status(200).json({
      success: true,
      message: "Pro Bonus Income fetched successfully",
      data: simplifiedHistory,
    });

  } catch (error) {
    console.error("Error in fetching probonusIncome:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
},

runDomesticIncomeCalculation: async (req, res) => {
  try {
    const {userId} = req.params
    const user= await UserModel.findOne({userId})
    if(!user)res.status(404).json({ success: false, message: "not found user." });
    // calculateDomesticIncomeForAllUsers()
    // await calculateDomesticIncomeForAllUsers();
   await calculateDomesticIncome(user._id)
    res.status(200).json({ success: true, message: "Domestic income calculated successfully." });
  } catch (error) {
    console.error("Error calculating domestic income:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
},
runRoyaltyIncomeCalculation: async (req, res) => {
  try {
 const {userId} = req.params
    const user= await UserModel.findOne({userId})
    // await calculateRoyaltyIncomeForAllUsers(user_id);
    await calculateRoyaltyIncome(user._id)
    res.status(200).json({ success: true, message: "royalty income calculated successfully." });
  } catch (error) {
    console.error("Error calculating domestic income:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
},



// getDownlineLevels: async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const rootUser = await UserModel.findOne({ userId }); // Find by userId
//     if (!rootUser) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     const levelStats = [];
//     let currentLevelUserIds = [rootUser._id];

//     // Thresholds per level
//     const thresholds = {
//       1: 3000,
//       2: 8000,
//       3: 20000,
//       4: 40000,
//       5: 80000,
//       6: 120000,
//     };

//     for (let level = 1; level <= 20; level++) {
//       let downlineUsers = [];

//       if (currentLevelUserIds.length > 0) {
//         downlineUsers = await UserModel.find(
//           { referrer: { $in: currentLevelUserIds } },
//           '_id totalInvested'
//         );
//       }

//       const totalMembers = downlineUsers.length;
//       const totalInvestment = downlineUsers.reduce(
//         (sum, user) => sum + (user.totalInvested || 0),
//         0
//       );

//       const requiredInvestment = thresholds[level] || 0;

//       const isQualified =
//         (level <= 6 && totalInvestment >= requiredInvestment) ||
//         (level > 6 && rootUser.domesticUnlockedLevel >= level);

//       const status = isQualified ? "qualified" : "not qualified";

//       levelStats.push({
//         level,
//         totalMembers,
//         totalInvestment,
//         status,
//       });

//       // Always continue to next level (show all 20 levels)
//       currentLevelUserIds = downlineUsers.map(user => user._id);
//     }

//     return res.json({ success: true, levels: levelStats });
//   } catch (error) {
//     console.error("Error in getDownlineLevels:", error);
//     return res.status(500).json({ success: false, error: "Server error" });
//   }
// },

getDownlineLevels: async (req, res) => {
  try {
    const { userId } = req.params;

    const rootUser = await UserModel.findOne({ userId });
    if (!rootUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const levelStats = [];
    let currentLevelUserIds = [rootUser._id];

    // Store total investments at each level
    const levelInvestments = {};

    for (let level = 1; level <= 20; level++) {
      let downlineUsers = [];

      if (currentLevelUserIds.length > 0) {
        downlineUsers = await UserModel.find(
          { referrer: { $in: currentLevelUserIds } },
          '_id totalInvested'
        );
      }

      const totalMembers = downlineUsers.length;
      const totalInvestment = downlineUsers.reduce(
        (sum, user) => sum + (user.totalInvested || 0),
        0
      );

      levelInvestments[level] = totalInvestment;

      let isQualified = false;

      if (level === 1) {
        isQualified = true; // Always qualified
      } else if (level === 2 && levelInvestments[1] >= 3000) {
        isQualified = true;
      } else if (level === 3 && levelInvestments[2] >= 8000) {
        isQualified = true;
      } else if (level === 4 && levelInvestments[3] >= 20000) {
        isQualified = true;
      } else if (level === 5 && levelInvestments[4] >= 40000) {
        isQualified = true;
      } else if (level >= 6 && level <= 10 && levelInvestments[5] >= 80000) {
        isQualified = true;
      } else if (level >= 11 && level <= 20 && levelInvestments[6] >= 120000) {
        isQualified = true;
      }

      levelStats.push({
        level,
        totalMembers,
        totalInvestment,
        status: isQualified ? "qualified" : "not qualified",
      });

      currentLevelUserIds = downlineUsers.map(user => user._id);
    }

    return res.json({ success: true, levels: levelStats });

  } catch (error) {
    console.error("Error in getDownlineLevels:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
},


textRioincome: async(req, res) =>{
  try {
    await resetDailyIncomes();
    await calculateDailyIncome();
    await calculateDomesticIncomeForAllUsers();

    res.status(200).json({ success: true, message: "Rio calculated successfully." });
  } catch (error) {
    console.error("Error calculating domestic income:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
},

removeRoiduplicate: async(req, res) =>{
  try {
    // await duplicateroi();
    // await removeDuplicateDomesticIncome();
    await recalculateTotalIncomeForAllUsers();
    // await updateTodayIncomeFromHistory();

  
    res.status(200).json({ success: true, message: "Remove calculated successfully." });
  } catch (error) {
    console.error("Error calculating domestic income:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
},

getLevelMembers: async (req, res) => {
  try {
    const { userId } = req.params;
    const { level } = req.query;
    const levelNum = parseInt(level);

    if (!userId || isNaN(levelNum)) {
      return res.status(400).json({ success: false, message: "userId and level (number) are required" });
    }

    const rootUser = await UserModel.findOne({ userId });
    if (!rootUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let currentLevelUserIds = [rootUser._id];
    let targetUsers = [];

    for (let i = 1; i <= levelNum; i++) {
      const nextLevelUsers = await UserModel.find({ referrer: { $in: currentLevelUserIds } });

      if (i === levelNum) {
        targetUsers = nextLevelUsers.map(user => ({
          name: user.name,
          userId: user.userId,
          totalInvested: user.totalInvested,
          createdAt: user.createdAt
        }));
        break;
      }

      currentLevelUserIds = nextLevelUsers.map(user => user._id);
      if (currentLevelUserIds.length === 0) break;
    }

    res.json({
      success: true,
      level: levelNum,
      totalUsers: targetUsers.length,
      users: targetUsers
    });
  } catch (error) {
    console.error("Error fetching level members:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
},

getRoyaltyHistory: async(req, res) => {
try {
  const user = await UserModel.findById(req.currentUser._id).select('royaltyHistory')
  
    if (!user) return res.status(404).json({success: false, message: "User not found",});
        res.status(200).json({
      success: true,
      message: "Royalty History fetched successfully",
      data: user.royaltyHistory,
    });
    

} catch (error) {
    console.error("Error fetching royalty history:", error);
    res.status(500).json({
      success: false,
      message: "Server error", 
      error
    });
}
},

getROIIncomeHistory: async (req, res) => {
  try {
    const user = await UserModel.findById(req.currentUser._id).select('roiIncomeHistory');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "ROI income history fetched",
      data: user.roiIncomeHistory
    });
  } catch (err) {
    console.error("Error fetching ROI income history", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
},

getDomesticIncomeHistory: async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Initialize structure for all 20 levels
    const historyByLevel = {};
    for (let i = 1; i <= 20; i++) {
      historyByLevel[i] = {
        level: i,
        totalIncome: 0,
        users: [] // { fromUser, income }
      };
    }

    // Process user's domesticIncomeDetails
    for (const record of user.domesticIncomeDetails) {
      const lvl = record.level;
      if (!historyByLevel[lvl]) continue;

      historyByLevel[lvl].totalIncome += record.income;
      historyByLevel[lvl].users.push({
        fromUser: record.fromUser || "N/A",
        income: record.income,
        username: record.username,
        date: record.date
      });
    }

    return res.json({
      success: true,
      userId: user.userId,
      history: Object.values(historyByLevel) // array format
    });

  } catch (err) {
    console.error("Domestic Income History Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
},



}

export { profileController };

