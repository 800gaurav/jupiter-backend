import { Router } from "express";
import { adminTicketController } from "../../controllers/admin/ticket.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";


const router = Router();

router.get("/", requireAuth(['admin']), adminTicketController.getAllTicket)
router.patch("/update/:id",  requireAuth(['admin']),adminTicketController.updateTicket)

export { router as adminTicketRoutes }