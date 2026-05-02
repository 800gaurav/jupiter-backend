
import dayjs from "dayjs";
import { UserModel } from "../models/user.model.js";

export const removeDuplicateDomesticIncome = async () => {
  const users = await UserModel.find({ "domesticIncomeDetails.1": { $exists: true } });

  for (const user of users) {
    const seenEntries = new Set();
    const cleanedEntries = [];

    for (const entry of user.domesticIncomeDetails) {
      const key = `${entry.fromUser}-${entry.level}-${dayjs(entry.date).format("YYYY-MM-DD")}`;

      if (!seenEntries.has(key)) {
        seenEntries.add(key);
        cleanedEntries.push(entry);
      } else {
        console.log(`🧹 Duplicate entry for user ${user._id} from ${entry.fromUser} on level ${entry.level} - ${dayjs(entry.date).format("YYYY-MM-DD")}`);
      }
    }

    if (cleanedEntries.length < user.domesticIncomeDetails.length) {
      user.domesticIncomeDetails = cleanedEntries;
      await user.save();
      console.log(`✅ Cleaned domesticIncomeDetails for user ${user.userId || user._id}`);
    }
  }

  console.log("🎉 All duplicate domestic income entries removed.");
};
