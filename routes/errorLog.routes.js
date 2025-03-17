import express from "express";
import { getAllErrors, getOneError, logError } from "../controllers/errorLog.controller.js";

const router = express.Router();

router.post("/log-error", logError);
router.get("/logs", getAllErrors);
router.get("/getOneError/:id", getOneError);

export default router;
