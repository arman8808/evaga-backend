import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
  acceptUserOrder,
  cancelOrder,
  endUserOrder,
  getAllCancelledOrders,
  getAllCompletedOrders,
  getOneOrderDetails,
  getVendorActiveOrders,
  getVendorconfirmedOrders,
  getVendorNewOrders,
  startUserOrder,
  verifyEndService,
  verifyStart,
} from "../controllers/getVendororder.controller.js";

const router = Router();

router
  .route("/get-new-order-by-vendor-Id/:vendorId")
  .get(verifyJwt(["vendor"]), upload().none(), getVendorNewOrders);
router
  .route("/get-confirmed-order-by-vendor-Id/:vendorId")
  .get(verifyJwt(["vendor"]), upload().none(), getVendorconfirmedOrders);
router
  .route("/acceptUserOrder/:orderId/:id")
  .post(verifyJwt(["vendor"]), upload().none(), acceptUserOrder);
router
  .route("/startUserOrder/:orderId/:id")
  .post(verifyJwt(["vendor"]), upload().none(), startUserOrder);
router
  .route("/endUserOrder/:orderId/:id")
  .post(verifyJwt(["vendor"]), upload().none(), endUserOrder);
router
  .route("/verifyEndService/:orderId/:id")
  .post(verifyJwt(["vendor"]), upload().none(), verifyEndService);
router
  .route("/verifyStartService/:orderId/:id")
  .post(verifyJwt(["vendor"]), upload().none(), verifyStart);
router
  .route("/getVendorActiveOrders/:vendorId")
  .get(verifyJwt(["vendor"]), upload().none(), getVendorActiveOrders);
router
  .route("/getAllCompletedOrders/:vendorId")
  .get(verifyJwt(["vendor"]), upload().none(), getAllCompletedOrders);
router
  .route("/getAllCancelledOrders/:vendorId")
  .get(verifyJwt(["vendor"]), upload().none(), getAllCancelledOrders);
router
  .route("/cancelOrder")
  .post(verifyJwt(["vendor"]), upload().none(), cancelOrder);
router
  .route("/getOneOrderDetails")
  .post(
    
    verifyJwt(["vendor"]),
    
    upload().none(), getOneOrderDetails);

export default router;
