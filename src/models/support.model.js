import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["open", "in_progress", "resolved", "closed"],
            default: "open"
        },

        responses: [
            {
                message: String,
                responder: {
                    type: mongoose.Types.ObjectId,
                    ref: "User"
                },
                timestamp: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

export const SupportTicketModel = mongoose.model("SupportTicket", supportTicketSchema);
