import { Router } from "express";
import { addVenderService } from "../controllers/vender.service.form.controller.js";

const router = Router();

router.route('/add-new-service').post(addVenderService)


export default router;
