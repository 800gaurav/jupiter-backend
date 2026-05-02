// import { UserModel } from "../models/user.model.js";


// export const recalculateTotalIncomeForAllUsers = async () => {
//   const users = await UserModel.find();

//   for (const user of users) {
//     try {
//       // ✅ 1. Calculate ROI Income
//       const totalROI = user.roiIncomeHistory?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

//       // ✅ 2. Calculate Domestic Income
//       const totalDomestic = user.domesticIncomeDetails?.reduce((sum, entry) => sum + (entry.income || 0), 0) || 0;

//       const probonus = user.proBonusHistory?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;
//       const todayincome = user?.todayIncome

//       // ✅ 3. Set updated fields
//       const total = totalROI + totalDomestic + probonus;
//       user.proBonusIncome = probonus;
//       user.roiIncome = totalROI;
//       user.totalDomesticIncome = totalDomestic;
//       user.totalProfitEarned = total;
//       user.walletBalance = total;

//       await user.save();
//       console.log(`✅ Updated user ${user.userId || user._id}: ROI = ${totalROI}, Domestic = ${totalDomestic}`);
//     } catch (err) {
//       console.error(`❌ Error updating user ${user.userId || user._id}:`, err.message);
//     }
//   }

//   console.log("🎉 All users' income recalculated and updated.");
// };
import { UserModel } from "../models/user.model.js";


export const recalculateTotalIncomeForAllUsers = async () => {
  const users = await UserModel.find();

  for (const user of users) {
    try {
      // ✅ 1. Calculate ROI Income
      const totalROI = user.roiIncomeHistory?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

      // ✅ 2. Calculate Domestic Income
      // const todayIncome = user.domesticIncomeDetails?.reduce((sum, entry) => sum + (entry.income || 0), 0) || 0;

      const probonus = user.proBonusHistory?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;
      const todayincome = user?.todayIncome

      // ✅ 3. Set updated fields
    
   
      user.roiIncome -= todayincome;
      // user.totalDomesticIncome = totalDomestic;
      user.totalProfitEarned -= todayincome;
      user.walletBalance -= todayincome;

      await user.save();
      console.log(`✅ Updated user ${user.userId || user._id}: ROI = ${totalROI},`);
    } catch (err) {
      console.error(`❌ Error updating user ${user.userId || user._id}:`, err.message);
    }
  }

  console.log("🎉 All users' income recalculated and updated.");
};
