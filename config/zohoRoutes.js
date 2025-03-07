import express from "express";
import axios from "axios";
import { authMiddleware, refreshAccessToken } from "./zohoAuth.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const ORG_ID = process.env.ORG_ID;


router.get("/auth/callback", async (req, res) => {
  const authCode = req.query.code;
  if (!authCode) return res.status(400).json({ error: "Authorization code missing" });

  const tokenData = await getAccessToken(authCode);
  res.json(tokenData);
});

router.post("/create-invoice", authMiddleware, async (req, res) => {
  try {
    const response = await axios.post(
      "https://www.zohoapis.com/invoice/v3/invoices",
      {
        customer_id: "123456789", 
        line_items: [
          {
            item_id: "987654321",
            rate: 100,
            quantity: 1
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${await refreshAccessToken()}`,
          "X-com-zoho-invoice-organizationid": ORG_ID,
          "Content-Type": "application/json"
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error creating invoice:", error.response?.data || error.message);
    res.status(500).json(error.response?.data || error.message);
  }
});


router.get("/invoices", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get("https://www.zohoapis.com/invoice/v3/invoices", {
      headers: {
        Authorization: `Bearer ${await refreshAccessToken()}`,
        "X-com-zoho-invoice-organizationid": ORG_ID
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching invoices:", error.response?.data || error.message);
    res.status(500).json(error.response?.data || error.message);
  }
});

export default router;
