// import { UserModel } from "../models/user.model.js";
// import { successResponse } from "../utils/api-response.js";

// function getBoostrate(referalCount){
//     if (referalCount >=20) return 0.03;
//     if (referalCount >=16) return 0.025;
//     if (referalCount >=12) return 0.02;
//     if (referalCount >=8) return 0.015;
//     if (referalCount >=4) return 0.01;
//    return null;
// }

// function getBaseRate(daysPassed){
//     if (daysPassed < 20) return 0.005;
//     if (daysPassed < 40) return 0.0075;
//     if (daysPassed < 80) return 0.01;
//     if (daysPassed < 160) return 0.015;
//     if (daysPassed < 250) return 0.02;
//     if (daysPassed < 300) return 0.025;
//     if (daysPassed < 400) return 0.03;
//     return 0;
// }

// const testingMode = true; // ✅ set true only for testing

//  export const calculateDailyIncome = async (req, res) => {
//   const users = await UserModel.find({ "nfts.0": { $exists: true } }).populate("referrer");
//   console.log("📦 Users fetched:", users.length);

//   for (const user of users) {
//     const totalReferals = await UserModel.countDocuments({ referrer: user._id });
//     let dailyTotalProfit = 0;

//     for (const nftEntry of user.nfts) {
//       const { purchasedAt, price } = nftEntry;

//       // Simulated daysPassed for testing
//       const daysPassed = testingMode
//         ? 1 // 👈 set any test day here
//         : dayjs().diff(dayjs(purchasedAt), 'day');

//       if (daysPassed >= 400) continue;

//       const newReferralCount = await UserModel.countDocuments({
//         referrer: user._id,
//         createdAt: { $gt: purchasedAt },
//       });

//       let rate = getBaseRate(daysPassed);
//       const boostRate = getBoostrate(newReferralCount);

//       if (boostRate && boostRate > rate) {
//         rate = boostRate;
//         nftEntry.planType = "INCREASED_ROI";
//         nftEntry.boostRate = boostRate;
//       } else {
//         nftEntry.planType = "ROI";
//         nftEntry.boostRate = null;
//       }

//       const todayIncome = price * rate;

//       user.todayIncome = (user.todayIncome || 0) + todayIncome; // 🧠 Add to today's income
//       nftEntry.profitEarned += todayIncome;
//       dailyTotalProfit += todayIncome;
//       user.totalreferaralCount = totalReferals
//     }

//     user.totalProfitEarned = (user.totalProfitEarned || 0) + dailyTotalProfit;
//     await user.save();
//     successResponse (res, "retun recived successfully", user, 200)
//     console.log(`💰 Income updated for ${user.name || user.email}: ₹${dailyTotalProfit.toFixed(2)}`);
//   }
// };
