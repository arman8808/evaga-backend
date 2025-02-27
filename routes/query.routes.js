import express from "express";
import {
  createQuery,
  getUserQueries,
  getVendorQueries,
} from "../controllers/query.controller.js";

const router = express.Router();

router.post("/create", createQuery);

router.get("/user/:userId", getUserQueries);

router.get("/vendor/:userId", getVendorQueries);

export default router;
