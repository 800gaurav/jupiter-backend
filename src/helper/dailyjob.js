import cron from "node-cron";
import fs from "fs";
import path from "path";
import { calculateDailyIncome } from "../incomecalculation/retunonequity.js";
import { resetDailyIncomes } from "./resetdailyincome.js";
import { calculateDomesticIncomeForAllUsers } from "../incomecalculation/domesticincome.js";
import { calculateRoyaltyIncomeForAllUsers } from "../incomecalculation/royaltyIncome.js";
import { evaluateAllUsersRankRewards } from "../incomecalculation/rewardIncome.js";

const logFilePath = path.resolve("lastJobRunDate.txt");

const hasJobRunToday = () => {
  if (!fs.existsSync(logFilePath)) return false;
  const lastRunDate = fs.readFileSync(logFilePath, "utf-8");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return lastRunDate === today;
};

const updateLastRunDate = () => {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  fs.writeFileSync(logFilePath, today, "utf-8");
};


// Helper function to run the daily jobs
// const runDailyJob = async () => {
//     const today = new Date().getDay();

//   if (hasJobRunToday()) {
//     console.log("⏱ Job already executed today, skipping.");
//     return;
//   }

//   await resetDailyIncomes();
//   console.log("reset daily income")
//   if (today !== 0) { // Skip daily and domestic income on Monday
//     await calculateDailyIncome();
//     await evaluateAllUsersRankRewards();
//     await calculateDomesticIncomeForAllUsers();
//   } else {
//     console.log("Skipping Daily and Domestic Income on Monday");
//   }

//   // Get current day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
// if (today === 0 || today === 4) { // Monday or Friday
//    await calculateRoyaltyIncomeForAllUsers();
//   }

//    updateLastRunDate();

// };

// Helper function to run the daily jobs
const runDailyJob = async () => {
  const today = new Date().getDay(); 
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // ✅ Sat & Sun skip completely
  if (today === 0 || today === 6) {
    console.log("🛑 Weekend (Sat/Sun) => Skipping all incomes.");
    return;
  }

  if (hasJobRunToday()) {
    console.log("⏱ Job already executed today, skipping.");
    return;
  }

  await resetDailyIncomes();
  console.log("✅ reset daily income done");

  // ✅ Daily & Domestic & Rank reward (Mon–Fri)
  await calculateDailyIncome();
  await evaluateAllUsersRankRewards();
  await calculateDomesticIncomeForAllUsers();
  await calculateRoyaltyIncomeForAllUsers();

  updateLastRunDate();
};



let isRunning = false;

cron.schedule("0 6 * * *", async ()=> {
  if (isRunning) {
    console.log("⛔ Job already running, skipping...");
    return;
  }

  isRunning = true;
  console.log("🚀 Starting Daily Job...");
  try {
    await runDailyJob();
    console.log("✅ Job completed.");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    isRunning = false;
  }
}, {
  timezone: "Asia/Kolkata"
});

