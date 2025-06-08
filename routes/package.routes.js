import { Router } from "express";
import {
  getAllPackage,
  getOnepackage,
  getOnePackagePerCategory,
  getPackagesByCategory,
} from "../controllers/package.controller.js";

const router = Router();

router.route("/get-all-packages").get(getAllPackage);
router.route("/getOnePackagePerCategory").get(getOnePackagePerCategory);
router.route("/get-one-package/:serviceId/:packageid").get(getOnepackage);
router.route("/get-package-by-category").get(getPackagesByCategory);
export default router;
