import express from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import { confirmBuyNft, getbuynft, sendPurchaseOtp } from '../../controllers/user/nft.controller.js';
import { calculateDailyIncome } from '../../incomecalculation/retunonequity.js';


const router = express.Router();

router.post('/send-otp-buy-nft/:userId', requireAuth(["admin", "user"]), sendPurchaseOtp)
router.post('/buy-nft', requireAuth(["admin", "user"]), confirmBuyNft)
router.get('/get-user-nft/:userId', requireAuth(["admin", "user"]), getbuynft)
router.get('/calculate', calculateDailyIncome)

export {router as nftpurchaseRouter}