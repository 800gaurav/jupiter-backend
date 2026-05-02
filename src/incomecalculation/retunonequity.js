
import { getAvailableIncome } from "../helper/capping.js";
import { UserModel } from "../models/user.model.js";

// 🆕 ROI based on investment amount slabs
function getTradeBonusRate(amount) {
    if (amount >= 10001 && amount <= 50000) return 0.03;
    if (amount >= 5001 && amount <= 10000) return 0.025;
    if (amount >= 2001 && amount <= 5000) return 0.02;
    if (amount >= 1001 && amount <= 2000) return 0.015;
    if (amount >= 501 && amount <= 1000) return 0.01;
    if (amount >= 20 && amount <= 500) return 0.005;
    return 0;
}
function getnewTradeBonusRate(amount) {
    if (amount >= 10001 && amount <= 50000) return 0.05;
    if (amount >= 5001 && amount <= 10000) return 0.03;
    if (amount >= 2001 && amount <= 5000) return 0.025;
    if (amount >= 1001 && amount <= 2000) return 0.02;
    if (amount >= 501 && amount <= 1000) return 0.015;
    if (amount >= 20 && amount <= 500) return 0.01;
    return 0;
}

export const calculateDailyIncome = async () => {
    // const OLD_USER = new Date("2026-01-13")
    const OLD_USER = new Date(Date.UTC(2026, 0, 13));
    const users = await UserModel.find({ totalInvested: { $gte: 20 } });
 
    
    for (const user of users) {
        const diractActiveteam =await UserModel.countDocuments({ referrer: user._id, isActivated: true })
        if (user.stopROIIncome) continue;
        let rate
       if (user.createdAt >= OLD_USER) {
        if (diractActiveteam >= 10 &&  user.referralBonus === false) {
            user.referralBonus = true
            user.walletBalance = (user.walletBalance || 0) + 20;
            user.totalProfitEarned = (user.totalProfitEarned || 0) + 20;
        }
       rate = getnewTradeBonusRate(user.totalInvested);
       } else {
        rate = getTradeBonusRate(user.totalInvested);
       }
        
        const todayIncome = user.totalInvested * rate;

        // ✅ Cap check
        const available = await getAvailableIncome(user._id, "nonWorking");
        if (available <= 0) {
            user.stopROIIncome = true;
            await user.save();
            continue;
        }

        const addableIncome = Math.min(todayIncome, available);

        user.todayIncome += addableIncome;
        user.walletBalance += addableIncome;
        user.roiIncome += addableIncome;
        user.totalProfitEarned = (user.totalProfitEarned || 0) + addableIncome;

        user.roiIncomeHistory.push({
            date: new Date(),
            amount: addableIncome
        });

         await user.save();
    }
};