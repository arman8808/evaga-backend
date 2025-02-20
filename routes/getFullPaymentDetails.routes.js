import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { getPaymentDetails } from "../controllers/getFullpaymentDetails.controller.js";

const router = Router();

router
  .route("/get-full-payment-deatils-by-orderId/:orderId")
  .post(upload().none(), getPaymentDetails);

export default router;
