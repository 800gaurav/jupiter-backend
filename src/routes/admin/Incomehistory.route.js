import { Router } from "express";
import { incomehistoryController } from "../../controllers/admin/incomehistory.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
const router = Router();

router.get("/pro-bonus-history", requireAuth(["admin"]), incomehistoryController.proBonusHistory)
router.get("/roi-history", requireAuth(["admin"]), incomehistoryController.roihistory)
router.get("/royalty-history", requireAuth(["admin"]), incomehistoryController.getAllRoyaltyIncomeHistory)
router.get("/domestic-history", requireAuth(["admin"]), incomehistoryController.getDomesticIncomeHistory)
router.get("/my-downline/:userId", requireAuth(["user", "admin"]), incomehistoryController.getUserNetwork)


export {router as incomeHistory}