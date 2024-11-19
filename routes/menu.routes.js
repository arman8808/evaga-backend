import { Router } from "express";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
  createMenu,
  deleteMenu,
  getAllMenus,
  getMenuById,
  updateMenu,
} from "../controllers/menu.controller.js";

const router = Router();

router.route("/create-new-menu").post( createMenu);
router.route("/get-one-menu").get(verifyJwt(["admin"]), getMenuById);
router.route("/get-all-menu").get(verifyJwt(["admin"]), getAllMenus);
router.route("/update-one-menu").put(verifyJwt(["admin"]), updateMenu);
router.route("/delete-one-menu").delete(verifyJwt(["admin"]), deleteMenu);

export default router;
