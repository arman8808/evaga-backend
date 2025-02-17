import express from "express";
import { createOrderController } from "../controllers/payment.controller.js";
import { validateOrderRequest } from "../middlewares/validateRequest.js";

const router = express.Router();

router.post("/create-order", validateOrderRequest, createOrderController);


export default router;
