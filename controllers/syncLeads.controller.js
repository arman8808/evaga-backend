import axios from "axios";
import SyncLeads from "../modals/syncLeads.modal.js";

const syncLeadsData = async (req, res) => {
    try {
        const response = await axios.post(
            "https://api-in21.leadsquared.com/v2/LeadManagement.svc/Leads.Get",
            {},
            {
                params: {
                    accessKey: process.env.leadsquareAcces_key,
                    secretKey: process.env.leadsquareSecret_key,
                },
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        // LeadSquared usually returns an array of leads directly or wrapped in an object
        const leadsArray = Array.isArray(response.data) ? response.data : (response.data.message || response.data.Data || []);

        let syncCount = 0;

        for (const lead of leadsArray) {
            // Extracting fields intelligently depending on exact API payload format
            const orderId = lead.orderId || lead.orderid || lead.mx_orderid || String(lead.ProspectID || lead.id || "");

            // Map other required fields
            const customerName = lead.customerName || lead.customer_name || lead.FirstName || lead.Name || "N/A";
            const customerMobile = lead.customerMobile || lead.customer_mobile || lead.Phone || lead.Mobile || "N/A";

            // Format items array if available
            let parsedItems = [];
            let items = [];
            if (lead.items && Array.isArray(lead.items)) {
                parsedItems = lead.items;
            } else if (typeof lead.items === "string") {
                try {
                    parsedItems = JSON.parse(lead.items);
                } catch (e) {
                    parsedItems = [];
                }
            }

            for (let item of parsedItems) {
                let statusVal = item.status || item.currentStatus || "pending";
                items.push({
                    name: item.name || item.itemName || "Unknown",
                    currentStatus: statusVal,
                    statusHistory: [
                        {
                            status: statusVal,
                            updatedBy: "system",
                            timestamp: new Date()
                        }
                    ]
                });
            }

            // Save to DB only if it isn't already present
            if (orderId) {
                const existingLead = await SyncLeads.findOne({ orderId });
                if (!existingLead) {
                    const newSyncLead = new SyncLeads({
                        orderId,
                        customerName,
                        customerMobile,
                        items
                    });
                    await newSyncLead.save();
                    syncCount++;
                }
            }
        }

        return res.status(200).json({
            message: "Leads synced successfully",
            syncedCount: syncCount
        });

    } catch (error) {
        console.error("Error in syncLeadsData:", error);
        return res.status(500).json({ error: "Internal server error during lead sync." });
    }
};

const getAllSyncLeads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sort = (req.query.sort || "").toLowerCase();

        const skip = (page - 1) * limit;

        // "we will sort on createAt" - Default behavior
        let sortOptions = { createdAt: -1 };

        // "filter for sorting on a-z and z-a"
        if (sort === "a-z") {
            sortOptions = { customerName: 1 };
        } else if (sort === "z-a") {
            sortOptions = { customerName: -1 };
        }

        const totalCount = await SyncLeads.countDocuments();
        const leads = await SyncLeads.find()
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            leads,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        });
    } catch (error) {
        console.error("Error in getAllSyncLeads:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

const getOneSyncLead = async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await SyncLeads.findById(id);

        if (!lead) {
            return res.status(404).json({ error: "Lead not found" });
        }

        return res.status(200).json(lead);
    } catch (error) {
        console.error("Error in getOneSyncLead:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

const updateOneSyncLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { itemName, status, ...updatedData } = req.body;

        const lead = await SyncLeads.findById(id);

        if (!lead) {
            return res.status(404).json({ error: "Lead not found" });
        }

        // Apply any valid top-level changes
        Object.assign(lead, updatedData);

        // Replace entire array if user passes an items array
        if (updatedData.items && Array.isArray(updatedData.items)) {
            lead.items = updatedData.items;
        }

        // Process itemName and status payload specifically for the items array
        if (itemName && status) {
            const existingItemIndex = lead.items.findIndex(item => item.name === itemName);
            const updatedBy = req.user && req.user._id ? String(req.user._id) : "system";

            if (existingItemIndex > -1) {
                // Update existing item status
                lead.items[existingItemIndex].currentStatus = status;
                lead.items[existingItemIndex].statusHistory.push({
                    status: status,
                    updatedBy: updatedBy,
                    timestamp: new Date()
                });
            } else {
                // Need to insert new item
                lead.items.push({
                    name: itemName,
                    currentStatus: status,
                    statusHistory: [
                        {
                            status: status,
                            updatedBy: updatedBy,
                            timestamp: new Date()
                        }
                    ]
                });
            }
        }

        await lead.save();

        return res.status(200).json({ message: "Lead updated successfully", lead: lead });
    } catch (error) {
        console.error("Error in updateOneSyncLead:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

const deleteOneSyncLead = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedLead = await SyncLeads.findByIdAndDelete(id);

        if (!deletedLead) {
            return res.status(404).json({ error: "Lead not found" });
        }

        return res.status(200).json({ message: "Lead deleted successfully" });
    } catch (error) {
        console.error("Error in deleteOneSyncLead:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

const trackSyncLead = async (req, res) => {
    try {
        const { customerMobile } = req.body;

        const queryMobile = customerMobile;

        if (!queryMobile) {
            return res.status(400).json({ error: "Please provide customerMobile to track your order." });
        }

        const query = {};
        if (queryMobile) query.customerMobile = queryMobile;

        // Perform find just in case mobile number matches multiple orders
        // Exclude statusHistory and __v from the returned response
        const leads = await SyncLeads.find(query).select("-items.statusHistory -__v");

        if (!leads || leads.length === 0) {
            return res.status(404).json({ error: "No order found with the provided details." });
        }

        return res.status(200).json(leads);
    } catch (error) {
        console.error("Error in trackSyncLead:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

export {
    syncLeadsData,
    getAllSyncLeads,
    getOneSyncLead,
    updateOneSyncLead,
    deleteOneSyncLead,
    trackSyncLead
};
