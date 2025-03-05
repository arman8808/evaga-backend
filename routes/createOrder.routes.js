import { Router } from "express";
import {
  createOrder,
  payFullRemainingAmount,
  payPartialPayment,
  updateOrder,
} from "../controllers/createOrder.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/create-order/:userId/:numberOfParts").post(
  // verifyJwt(["user"]),
  upload().none(),
  createOrder
);
router.route("/update-order").post(
  // verifyJwt(["user"]),
  upload().none(),
  updateOrder
);
router.route("/payPartialPayment").post(
  // verifyJwt(["user"]),
  upload().none(),
  payPartialPayment
);
router.route("/payFullRemainingAmount").post(
  // verifyJwt(["user"]),
  upload().none(),
  payFullRemainingAmount
);

export default router;
