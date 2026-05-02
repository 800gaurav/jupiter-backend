import dayjs from "dayjs";
import { UserModel } from "../models/user.model.js";

export const duplicateroi = async () => {
  const users = await UserModel.find({ "roiIncomeHistory.1": { $exists: true } });

  for (const user of users) {
    const seenDates = new Set();
    const uniqueEntries = [];

    for (const entry of user.roiIncomeHistory) {
      const dateStr = dayjs(entry.date).format("YYYY-MM-DD");

      if (!seenDates.has(dateStr)) {
        seenDates.add(dateStr);
        uniqueEntries.push(entry);
      } else {
        console.log(`Duplicate found for user ${user._id} on ${dateStr}`);
      }
    }

    if (uniqueEntries.length < user.roiIncomeHistory.length) {
      user.roiIncomeHistory = uniqueEntries;
      await user.save();
      console.log(`✅ Cleaned duplicates for user ${user._id}`);
    }
  }

  console.log("✅✅ Duplicate ROI income history cleaned from all users.");
};