import { UserModel } from "../models/user.model.js";

// utils/getDownlineByLevels.js
export const getDownlineByLevels = async (userId, maxLevel = 20, skipLevel1 = false) => {
  const result = {};
  let currentLevelUsers = [userId];

  for (let level = 1; level <= maxLevel; level++) {
    const nextUsers = await UserModel.find({
      referrer: { $in: currentLevelUsers }
    }).select("-password -walletPin -emailOTP -txnpass");

    if (!nextUsers.length) break;

    if (!(skipLevel1 && level === 1)) {
      result[`level${level}`] = nextUsers;
    }

    currentLevelUsers = nextUsers.map(u => u._id);
  }

  return result;
};
