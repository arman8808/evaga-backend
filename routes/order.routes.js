import { Router } from "express";

import verifyJwt from "../middlewares/auth.middleware.js";
import {
  downloadOrdersCSV,
  getAllCancelledOrder,
  getAllCompletedOrder,
  getAllConfirmedOrder,
  getAllNewOrder,
  getAllOngoingOrder,
  getOneOrderDetail,
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
router
  .route("/getOneOrderDetail/:OrderId/:itemId")
  .get(verifyJwt(["admin"]), getOneOrderDetail);
router.route("/downloadOrdersCSV/:orderStatus").get(verifyJwt(["admin"]), downloadOrdersCSV);

export default router;
