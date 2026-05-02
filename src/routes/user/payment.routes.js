import { Router } from "express";

import { requireAuth } from "../../middlewares/require-auth.js";

import { initiatePayment, oxapayCallback, oxapayReturn } from "../../controllers/user/deposit.controller.js";
import { callbackpaymentstatus } from "../../controllers/user/withdraw.controller.js";

const router = Router();

router.post("/initiate", requireAuth(['user']), initiatePayment);
router.post("/callback", oxapayCallback);
router.get("/return", oxapayReturn);

//Withdraw
router.post("/withdraw-callback", callbackpaymentstatus);

export { router as oxapayRoutes }