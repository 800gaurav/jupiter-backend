
// import { getTeamBusinessByLevels } from "../helper/teambusinesslevel.js";

// import dayjs from "dayjs";
// import { UserModel } from "../models/user.model.js";

// const levelPlans = [
//   { level: 1, required: 3000, percent: 0.30, unlocks: 2 },
//   { level: 2, required: 8000, percent: 0.15, unlocks: 3 },
//   { level: 3, required: 20000, percent: 0.15, unlocks: 4 },
//   { level: 4, required: 40000, percent: 0.10, unlocks: 5 },
//   { level: 5, required: 80000, percent: 0.10, unlocks: 10 }, // unlocks 6–10
//   { level: 6, required: 120000, percent: 0.05, unlocks: 20 }, // unlocks 11–20
// ];

// export const calculateDomesticIncome = async ()=> {
// const users = await UserModel.find({})

// for (const user of users) {
//     const levelMap = await getTeamBusinessByLevels(user._id);

// let todayDomesticIncome = 0;

//     for (const plan of levelPlans) {

// if(user.domesticUnlockedLevel >= plan.unlocks) continue;
// let businessAtLevel = 0;

//   const applicableLevels  = paln.unlocks > 5 ? 
//   Array.from({length: plan.unlocks - user.domesticUnlockedLevel}, (_, i) => i + user.domesticUnlockedLevel + 1) :
//   [plan.level];  

//      // Sum up business from all applicable levels
//      for (const lvl of applicableLevels) {
//         const levelUsers = levelMap.get(lvl) || [];

//        for (const downlineUser of levelUsers) {
//           businessAtLevel += downlineUser.todayIncome || 0;
//         }
//      }

//      if(businessAtLevel >= plan.required) {
//         const income = businessAtLevel * plan.percent;

//         user.walletBalance += income;
//         user.totalDomesticIncome += income;
//          todayDomesticIncome = income

//          user.domesticIncomeDetails.push({
//             level: plan.level,
//             income,
//             businessAtLevel,
//             date: new Date()
//          });

//             user.domesticUnlockedLevel = plan.unlocks;
//      }
// }
//          user.todayIncome += todayDomesticIncome;
//          await user.save();
// }
// };



// import { UserModel } from "../models/user.model.js";

// const LEVEL_UNLOCKS = [
//   { level: 1, incomePercent: 0.30, requiredInvestment: 3000 },
//   { level: 2, incomePercent: 0.15, requiredInvestment: 8000 },
//   { level: 3, incomePercent: 0.15, requiredInvestment: 20000 },
//   { level: 4, incomePercent: 0.10, requiredInvestment: 40000 },
//   { level: 5, incomePercent: 0.10, requiredInvestment: 80000 },
//   { level: 6, incomePercent: 0.05, requiredInvestment: 120000 }
// ];

// export const getUsersAtLevel = async (rootUserId, maxLevel = 20) => {
//   const result = Array.from({ length: maxLevel }, () => []);
//   let currentLevelUsers = [rootUserId];

//   for (let level = 0; level < maxLevel; level++) {
//     const nextLevelUsers = await UserModel.find({ referrer: { $in: currentLevelUsers } }, '_id totalInvested todayIncome');
//     if (!nextLevelUsers.length) break;
//     result[level] = nextLevelUsers;
//     currentLevelUsers = nextLevelUsers.map(user => user._id);
//   }
//   return result;
// };

// export const calculateDomesticIncome = async (userId) => {
//   const user = await UserModel.findById(userId);
//   if (!user || !user.isActivated) return;

//   const levelWiseUsers = await getUsersAtLevel(userId, 20);
//   let unlockedLevel = user.domesticUnlockedLevel || 0;

//   for (let i = 0; i < levelWiseUsers.length; i++) {
//     const level = i + 1;
//     const usersAtLevel = levelWiseUsers[i] || [];
//     const todayIncomeFromLevel = usersAtLevel.reduce((acc, u) => acc + (u.todayIncome || 0), 0);

//     const config = LEVEL_UNLOCKS.find(l => l.level === level);
//     const incomePercent = config?.incomePercent || 0;
//     const requiredInvestment = config?.requiredInvestment || Infinity;

//     //  Distribute income if level is already unlocked
//     if (level <= unlockedLevel) {
//       const income = todayIncomeFromLevel * incomePercent;
//       user.walletBalance += income;
//       user.totalDomesticIncome += income;

//       user.domesticIncomeDetails.push({
//         level,
//         income,
//         businessAtLevel: 0,
//         date: new Date()
//       });
//     }

//     //  Check if we should unlock the next level(s)
//     if (unlockedLevel === i) {
//       const totalBusiness = usersAtLevel.reduce((acc, u) => acc + (u.totalInvested || 0), 0);
//       if (totalBusiness >= requiredInvestment) {
//         if (level === 5) {
//           user.domesticUnlockedLevel = 10;
//         } else if (level === 6) {
//           user.domesticUnlockedLevel = 20;
//         } else {
//           user.domesticUnlockedLevel = level;
//         }
//       } else {
//         break; // Stop checking next levels
//       }
//     }
//   }

//   await user.save();
// };



import { getAvailableIncome } from "../helper/capping.js";
import { UserModel } from "../models/user.model.js";
import dayjs from "dayjs";

const LEVEL_UNLOCKS = [
  { from: 1, to: 1, incomePercent: 0.20, requiredInvestment: 0 },
  { from: 2, to: 2, incomePercent: 0.15, requiredInvestment: 3000 },
  { from: 3, to: 3, incomePercent: 0.10, requiredInvestment: 5000 },
  { from: 4, to: 4, incomePercent: 0.10, requiredInvestment: 8000 },
  { from: 5, to: 10, incomePercent: 0.05, requiredInvestment: 20000 },
  { from: 11, to: 20, incomePercent: 0.02, requiredInvestment: 40000 },
];

export const getUsersAtLevel = async (rootUserId, maxLevel = 20) => {
  const result = Array.from({ length: maxLevel }, () => []);
  let currentLevelUsers = [rootUserId];

  for (let level = 0; level < maxLevel; level++) {
    const nextLevelUsers = await UserModel.find(
      { referrer: { $in: currentLevelUsers } },
      '_id totalInvested todayIncome userId, name'
    );
    if (!nextLevelUsers.length) break;
    result[level] = nextLevelUsers;
    currentLevelUsers = nextLevelUsers.map(user => user._id);
  }

  return result;
};



export const calculateDomesticIncome = async (userId) => {
  try {
    const todayStr = dayjs().format("YYYY-MM-DD");

    const user = await UserModel.findById(userId);
    if (!user) {
      console.error(`❌ User not found for ID: ${userId}`);
      return;
    }

    const levelWiseUsers = await getUsersAtLevel(userId, 20);
    console.log("📊 Level-wise Users length:", levelWiseUsers.length);

    let unlockedLevel = user.domesticUnlockedLevel || 1;
    console.log(`🔓 Current unlocked level: ${unlockedLevel}`);

    for (let i = 0; i < levelWiseUsers.length; i++) {
      const level = i + 1;
      const usersAtLevel = levelWiseUsers[i] || [];

      // find config by range
      const config = LEVEL_UNLOCKS.find(l => level >= l.from && level <= l.to);
      const incomePercent = config?.incomePercent || 0;
      const requiredInvestment = config?.requiredInvestment || 0;

      // 🔑 total business calculation
      let totalBusiness = 0;
      if (level === 5) {

        for (let l = 5; l <= 10; l++) {
          const users = levelWiseUsers[l - 1] || [];
          totalBusiness += users.reduce((acc, u) => acc + (u.totalInvested || 0), 0);
        }
      } else if (level === 11) {
        // check combined 11–20
        for (let l = 11; l <= 20; l++) {
          const users = levelWiseUsers[l - 1] || [];
          totalBusiness += users.reduce((acc, u) => acc + (u.totalInvested || 0), 0);
        }
      } else {
        // normal single level
        totalBusiness = usersAtLevel.reduce((acc, u) => acc + (u.totalInvested || 0), 0);
      }
      console.log("totalincoem", totalBusiness)
      // ✅ Only allow income if business requirement met
      if (level <= unlockedLevel && totalBusiness >= requiredInvestment) {
        for (const downUser of usersAtLevel) {
          const income = (downUser.todayIncome || 0) * incomePercent;
          if (income > 0) {

            // 🔒 apply working income capping
            const availableIncome = await getAvailableIncome(userId, "working");
            if (availableIncome <= 0) continue; // cap reached
            if (income > availableIncome) income = availableIncome;


            user.walletBalance += income;
            user.totalDomesticIncome += income;
            user.todayIncome += income;
            user.totalProfitEarned += income;

            user.domesticIncomeDetails.push({
              level,
              income,
              username: downUser.name,
              fromUser: downUser.userId,
              date: new Date()
            });
          }
        }

        // 🔓 Unlock next level
        if (unlockedLevel === level) {
          if (level === 4) {
            user.domesticUnlockedLevel = 5;   // unlock 5–10
            unlockedLevel = 5;
          } else if (level === 6) {
            user.domesticUnlockedLevel = 11;  // unlock 11–20
            unlockedLevel = 11;
          } else {
            user.domesticUnlockedLevel = level + 1;
            unlockedLevel = level + 1;
          }
          console.log(`✅ Level ${level} unlocked new level → ${unlockedLevel}`);
        }

      } else {
        console.log(`⛔ Level ${level} stopped — business=${totalBusiness}, required=${requiredInvestment}`);
        break;
      }
    }

    await user.save();
    console.log(`✅ Domestic income calculation completed for ${userId}`);

  } catch (err) {
    console.error("🔥 Error in calculateDomesticIncome:", err.message);
    console.error(err.stack);
  }
};
export const calculateDomesticIncomeForAllUsers = async (userId) => {
  const users = await UserModel.find();

  for (const user of users) {
    try {
      await calculateDomesticIncome(user._id);
      // await calculateDomesticIncome(userId);
    } catch (err) {
      console.error(`Domestic income error for user ${user.userId || user._id}:`, err.message);
    }
  }
};
