import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
  createForm,
  deleteForm,
  getAllForms,
  getOneForm,
  getOneFormWithCategoryAlongWithSubCategory,
  updateOneForm,
} from "../controllers/form.controller.js";
const router = Router();

router.route("/create-differnt-event-form").post(createForm);
router.route("/get-one-event-form").post(getOneForm);
router
  .route("/get-one-event-form-with-category/:categoryId")
  .get(getOneFormWithCategoryAlongWithSubCategory);
router.route("/get-all-event-form").post(getAllForms);
router.route("/update-one-event-form").post(updateOneForm);
router.route("/delete-one-event-form").post(deleteForm);

export default router;
