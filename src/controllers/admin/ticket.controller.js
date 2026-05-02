// controllers/admin/ticket.controller.js
import { SupportTicketModel } from "../../models/support.model.js";
import { errorResponse, successResponse } from "../../utils/api-response.js";

const adminTicketController = {
  getAllTicket: async (req, res) => {
    try {
      const { status, userId, sortBy, sortOrder, search } = req.query;
      
      // Build filter object
      const filter = {};
      
      if (status) {
        filter.status = status;
      }
      
      if (userId) {
        filter.userId = userId;
      }
      
      if (search) {
        filter.$or = [
          { subject: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Build sort object
      const sort = {};
      if (sortBy) {
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      } else {
        sort.createdAt = -1; // Default sort by newest first
      }
      
      // Get tickets with filters
      const tickets = await SupportTicketModel.find(filter)
        .sort(sort)
        .populate('userId', 'name email') // Populate user info
        .populate('responses.responder', 'name email'); // Populate responder info
      
      return successResponse(res, "Tickets retrieved successfully", tickets);
    } catch (error) {
      return errorResponse(res, "Error retrieving tickets", error.message);
    }
  },
  
  updateTicket: async (req, res) => {

      const { id } = req.params;
      const { status, response } = req.body;
      console.log(id)

      const userId = req.currentUser._id;
      // Validate ticket exists
      const ticket = await SupportTicketModel.findById(id);
      if (!ticket) {
        return errorResponse(res, "Ticket not found", null, 404);
      }
      
      // Update status if provided
      if (status) {
        ticket.status = status;
      }
      
      // Add response if provided
      if (response && response.message) {
        ticket.responses.push({
          message: response.message,
          responder: userId
        });
      }
      
      await ticket.save();
      
      // Populate the updated data before returning
      const updatedTicket = await SupportTicketModel.findById(id)
        .populate('userId', 'name email')
        .populate('responses.responder', 'name email');
      
      return successResponse(res, "Ticket updated successfully", updatedTicket);
   
  },
 
  
};

export { adminTicketController };