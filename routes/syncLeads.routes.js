import express from "express";
import {
    syncLeadsData,
    getAllSyncLeads,
    getOneSyncLead,
    updateOneSyncLead,
    deleteOneSyncLead,
    trackSyncLead
} from "../controllers/syncLeads.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.get("/sync-leads", syncLeadsData);
router.post("/sync-leads", verifyJwt(["admin", "sub_admin"]), syncLeadsData);

// GET all with pagination and sorting via query params
router.get("/get-all", getAllSyncLeads);

router.get("/get-one/:id", getOneSyncLead);
router.put("/update-one/:id", verifyJwt(["admin", "sub_admin"]), updateOneSyncLead);
router.delete("/delete-one/:id", verifyJwt(["admin", "sub_admin"]), deleteOneSyncLead);

// POST tracking route for frontend/users
router.post("/track", trackSyncLead);

export default router;
