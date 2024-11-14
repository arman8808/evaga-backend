import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { createForm } from "../controllers/form.controller.js";
const router = Router();

router.route("/create-differnt-event-form").post(createForm);

export default router;
