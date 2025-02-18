import { Router } from "express";
import { addToWaitlist, getWaitlist } from "../controllers/waitlist.controller.js";

const router = Router();

router.route("/add-to-waitlist").post(addToWaitlist);
router.route("/get-all-waitlist").get(getWaitlist);

export default router;
