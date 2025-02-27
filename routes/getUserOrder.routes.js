import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

import {
  getAllActiveOrders,
  getAllCancelledOrders,
  getAllCompletedOrders,
  getAllConfirmedOrders,
  getAllNewOrders,
  getSingleOrderItem,
  getUserOrder,
} from "../controllers/getUserOrder.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/get-order-by-user-Id/:userId")
  .get(verifyJwt(["user"]), upload().none(), getUserOrder);
router
  .route("/get-one-order-by-order-Id/:orderId/:itemId")
  .get(verifyJwt(["user"]), upload().none(), getSingleOrderItem);
router
  .route("/get-new-orders/:userId")
  .get(verifyJwt(["user"]), getAllNewOrders);

router
  .route("/get-confirmed-orders/:userId")
  .get(verifyJwt(["user"]), getAllConfirmedOrders);

router
  .route("/get-active-orders/:userId")
  .get(verifyJwt(["user"]), getAllActiveOrders);

router
  .route("/get-completed-orders/:userId")
  .get(verifyJwt(["user"]), getAllCompletedOrders);

router
  .route("/get-cancelled-orders/:userId")
  .get(verifyJwt(["user"]), getAllCancelledOrders);
export default router;
