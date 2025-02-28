import express from "express";
import {
  createQuery,
  getAllQueries,
  getOneQueries,
  getUserQueries,
  getVendorQueries,
} from "../controllers/query.controller.js";

const router = express.Router();

router.post("/create", createQuery);

router.get("/user/:userId", getUserQueries);

router.get("/vendor/:userId", getVendorQueries);
router.get("/get-all-query/:role", getAllQueries);
router.get("/getOneQueries/:queryId", getOneQueries);

export default router;
