import { UserModel } from "../models/user.model.js";

export const getAvailableIncome = async (userId, incomeType) => {
  const user = await UserModel.findById(userId);
  if (!user) return 0;

  const totalInvested = user.totalInvested || 0;

  // Caps
  const workingCap = 2 * totalInvested;
  const nonWorkingCap = 2 * totalInvested;

  // Current income
  const currentWorking =
    (user.proBonusIncome || 0) +
    (user.totalDomesticIncome || 0) +
    (user.royalyIncome || 0) +
    (user.rankRewardIncome || 0);

  const currentNonWorking =
    5 + // registration income
    (user.roiIncome || 0);

  if (incomeType === "working") return Math.max(workingCap - currentWorking, 0);
  if (incomeType === "nonWorking") return Math.max(nonWorkingCap - currentNonWorking, 0);

  return 0;
};
