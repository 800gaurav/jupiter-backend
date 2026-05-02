import dayjs from "dayjs";
import { UserModel } from "../models/user.model.js";


export const updateTodayIncomeFromHistory = async () => {
  const todayStr = dayjs().format("YYYY-MM-DD");
  const users = await UserModel.find();

  for (const user of users) {
    try {
      // Get ROI income for today
      const roiToday = (user.roiIncomeHistory || []).reduce((sum, entry) => {
        return dayjs(entry.date).format("YYYY-MM-DD") === todayStr
          ? sum + (entry.amount || 0)
          : sum;
      }, 0);

      // Get Domestic income for today
      const domesticToday = (user.domesticIncomeDetails || []).reduce((sum, entry) => {
        return dayjs(entry.date).format("YYYY-MM-DD") === todayStr
          ? sum + (entry.income || 0)
          : sum;
      }, 0);

      const totalTodayIncome = roiToday + domesticToday;

      // Set todayIncome field
      user.todayIncome = totalTodayIncome;

      await user.save();
      console.log(`✅ Updated todayIncome for user ${user.userId}: ₹${totalTodayIncome}`);
    } catch (err) {
      console.error(`❌ Error for user ${user.userId || user._id}:`, err.message);
    }
  }

  console.log("🎉 All users' todayIncome updated from ROI and domestic income history.");
};