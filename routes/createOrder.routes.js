import { Router } from "express";
import { createOrder, updateOrder } from "../controllers/createOrder.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/create-order/:userId/:numberOfParts").post(
    // verifyJwt(["user"]),
    upload().none(), createOrder);
router.route("/update-order").post(
    // verifyJwt(["user"]),
    upload().none(), updateOrder);

export default router;
