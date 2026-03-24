import mongoose from "mongoose";

const syncLeadsSchema = new mongoose.Schema(
    {
        orderId: { type: String, required: true, trim: true },
        customerName: { type: String, required: true, trim: true },
        customerMobile: { type: String, required: true, trim: true },
        items: [
            {
                name: { type: String },
                currentStatus: { type: String },
                statusHistory: [
                    {
                        status: { type: String },
                        updatedBy: { type: String },
                        timestamp: { type: Date, default: Date.now }
                    }
                ]
            }
        ]
    },
    { timestamps: true }
);

const SyncLeads = mongoose.model("SyncLeads", syncLeadsSchema);

export default SyncLeads;
