import express from 'express';
import { requireAuth } from "../../middlewares/require-auth.js";
import { getAllDepositHistory, getDepositHistory } from "../../controllers/user/deposit.controller.js";
import {
  requestWithdrawal,
  approveWithdrawal,
  getWithdrawHistory,
  walletToWallet,
  walletToFund,
  fundToFund,
  getTransferHistory,
  getWalletToFundHistory,
  getFundToFundHistory,
  getAllTransferHistory,
  rejectWithdrawal
} from "../../controllers/user/withdraw.controller.js"

const router = express.Router();

//Deposit Routes

router.get("/deposit-history/:userId", requireAuth(['admin', 'user']), getDepositHistory)
router.get('/history/all', requireAuth(['admin', 'user']), getAllDepositHistory);

//Withdrawal Routes
router.post("/withdraw-request", requireAuth(['admin', 'user']), requestWithdrawal)  // User requests a withdrawal
router.post("/withdraw-approve/:id", requireAuth(['admin']), approveWithdrawal)  // Admin approves a withdrawal
//db.withdraws.find({ userId: "AD102781" }).pretty()
// yaha se jo id aa jaegi usko paste krna params mai phr you will get approval
router.post("/withdraw-reject/:id", requireAuth(['admin']), rejectWithdrawal)
router.get("/withdraw-history", requireAuth(['admin', 'user']), getWithdrawHistory)  // Get user's withdrawal history
router.post("/wallet-to-wallet", requireAuth(['admin', 'user']), walletToWallet)  // WalletBalance → Another User's WalletBalance
router.post("/wallet-to-fund", requireAuth(['admin', 'user']), walletToFund)  // WalletBalance → Own FundBalance
router.post("/fund-to-fund", requireAuth(['admin', 'user']), fundToFund)  // FundBalance → Another User's FundBalance
router.get("/transfers/:userId", requireAuth(['admin', 'user']),getTransferHistory)  // Get user's transfer history (all types)
router.get("/all-transfer-history", requireAuth(['admin', 'user']), getAllTransferHistory);
router.get("/history/wallet-to-fund/:userId", requireAuth(['admin', 'user']), getWalletToFundHistory)
router.get("/history/fund-to-fund/:userId", requireAuth(['admin', 'user']), getFundToFundHistory)

export { router as paymentRoutes };
