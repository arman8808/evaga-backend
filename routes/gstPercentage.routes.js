import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
  addGstCategory,
  getAllGstCategories,
  getGstCategory,
  updateGstRate,
} from "../controllers/gstPercentage.controller.js";
const router = Router();

router.route("/add-gst-percentage").post(
  // verifyJwt(["admin"]),
  upload().none(),
  addGstCategory
);
router.route("/get-one-gst-percentage/:gstId").get(
  // verifyJwt(["admin"]),
  upload().none(),
  getGstCategory
);
router.route("/update-one-gst-percentage/:gstId").put(
  // verifyJwt(["admin"]),
  upload().none(),
  updateGstRate
);
router.route("/delete-one-gst-percentage/:gstId").delete(
  // verifyJwt(["admin"]),
  upload().none(),
  updateGstRate
);
router.route("/get-all-gst-percentage").get(
  // verifyJwt(["admin"]),
  upload().none(),
  getAllGstCategories
);

export default router;
