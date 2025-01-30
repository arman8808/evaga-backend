import { Router } from "express";
import {
  getAllPackage,
  getOnepackage,
} from "../controllers/package.controller.js";

const router = Router();

router.route("/get-all-packages").get(getAllPackage);
router.route("/get-one-package/:serviceId/:packageid").get(getOnepackage);
// router.route("/get-one-menu").get(verifyJwt(["admin"]), getMenuById);
// router.route("/get-all-menu").get(verifyJwt(["admin"]), getAllMenus);
// router.route("/update-one-menu").put(verifyJwt(["admin"]), updateMenu);
// router.route("/delete-one-menu").delete(verifyJwt(["admin"]), deleteMenu);

export default router;
