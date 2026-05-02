import { SupportTicketModel } from "../../models/support.model.js";
import { errorResponse, successResponse } from "../../utils/api-response.js";

const usetTicketController = {
  // Get all tickets for the logged-in user
  getMyTickets: async (req, res) => {
    try {
      const userId = req.currentUser._id;
      const tickets = await SupportTicketModel.find({ userId }).sort({ createdAt: -1 });

      successResponse(res, "Tickets fetched successfully", tickets);
    } catch (error) {
      console.error("Error in getMyTickets:", error);
      errorResponse(res, "Failed to fetch tickets", 500);
    }
  },

  // Create a new support ticket
  createTicket: async (req, res) => {
    try {
      const { subject, description } = req.body;
      const userId = req.currentUser._id;

      if (!subject || !description) {
        return errorResponse(res, "Subject and description are required", 400);
      }

      const newTicket = await SupportTicketModel.create({
        userId,
        subject,
        description
      });

      successResponse(res, "Support ticket created successfully", newTicket);
    } catch (error) {
      console.error("Error in createTicket:", error);
      errorResponse(res, "Failed to create ticket", 500);
    }
  },

  // Add a response to a ticket
  addResponseToTicket: async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { message } = req.body;
      const responderId = req.currentUser._id;

      if (!message) {
        return errorResponse(res, "Response message is required", 400);
      }

      const ticket = await SupportTicketModel.findById(ticketId);
      if (!ticket) return errorResponse(res, "Ticket not found", 404);

      ticket.responses.push({
        message,
        responder: responderId,
        timestamp: new Date()
      });

      await ticket.save();

      successResponse(res, "Response added to ticket", ticket);
    } catch (error) {
      console.error("Error in addResponseToTicket:", error);
      errorResponse(res, "Failed to add response", 500);
    }
  },

  // Get a single ticket by ID
  getTicketById: async (req, res) => {
    try {
      const { ticketId } = req.params;
      const ticket = await SupportTicketModel.findById(ticketId).populate("responses.responder", "name email");

      if (!ticket) return errorResponse(res, "Ticket not found", 404);

      successResponse(res, "Ticket fetched successfully", ticket);
    } catch (error) {
      console.error("Error in getTicketById:", error);
      errorResponse(res, "Failed to fetch ticket", 500);
    }
  }
};

export { usetTicketController };
