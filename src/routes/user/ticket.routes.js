import { Router } from "express";

import { requireAuth } from "../../middlewares/require-auth.js";
import { usetTicketController } from "../../controllers/user/ticket.controller.js";

const router = Router();

router.get("/my-tickets", requireAuth(['user']), usetTicketController.getMyTickets);
router.post("/create-tickets",requireAuth(['user']), usetTicketController.createTicket);
router.get("/ticket/:ticketId",requireAuth(['user']), usetTicketController.getTicketById);


export { router as userTicketRoutes }