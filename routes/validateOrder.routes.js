import { Router } from "express";
import { validateOrder } from "../controllers/validateOrder.js";
import { upload } from "../middlewares/multer.middleware.js";


const router = Router();

router.route("/validate-order").post(upload().none(), validateOrder);


export default router;
