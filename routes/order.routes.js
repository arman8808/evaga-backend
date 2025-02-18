import { Router } from "express";
import { createOrder } from "../controllers/createOrder.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-order/:userId").post(verifyJwt(["user"]), createOrder);

export default router;
