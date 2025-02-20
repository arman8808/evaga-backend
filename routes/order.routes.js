import { Router } from "express";

import verifyJwt from "../middlewares/auth.middleware.js";
import {
  getAllCancelledOrder,
  getAllCompletedOrder,
  getAllConfirmedOrder,
  getAllNewOrder,
  getAllOngoingOrder,
} from "../controllers/order.controller.js";

const router = Router();

router.route("/new-order").get(verifyJwt(["admin"]), getAllNewOrder);
router
  .route("/confirmed-order")
  .get(verifyJwt(["admin"]), getAllConfirmedOrder);
router.route("/ongoing-order").get(verifyJwt(["admin"]), getAllOngoingOrder);
router
  .route("/completed-order")
  .get(verifyJwt(["admin"]), getAllCompletedOrder);
router
  .route("/cancelled-order")
  .get(verifyJwt(["admin"]), getAllCancelledOrder);

export default router;
