import express from "express";
import axios from "axios";
import { authMiddleware, refreshAccessToken } from "./zohoAuth.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const ORG_ID = process.env.ORG_ID;

router.get("/auth/callback", async (req, res) => {
  const authCode = req.query.code;
  if (!authCode)
    return res.status(400).json({ error: "Authorization code missing" });

  const tokenData = await getAccessToken(authCode);
  res.json(tokenData);
});

router.post("/create-invoice", authMiddleware, async (req, res) => {
  try {
    const response = await axios.post(
      "https://www.zohoapis.in/invoice/v3/items",
      {
        name: "New Item",
        rate: 100,
        description: "Sample item description",
      },
      {
        headers: {
          Authorization: `Bearer ${await refreshAccessToken()}`,
          "X-com-zoho-invoice-organizationid": ORG_ID,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error creating invoice:",
      error.response?.data || error.message
    );
    res.status(500).json(error.response?.data || error.message);
  }
});

router.get("/invoices", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.zohoapis.com/invoice/v3/invoices",
      {
        headers: {
          Authorization: `Bearer ${await refreshAccessToken()}`,
          "X-com-zoho-invoice-organizationid": ORG_ID,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching invoices:",
      error.response?.data || error.message
    );
    res.status(500).json(error.response?.data || error.message);
  }
});
router.get(
  "/download-invoice/:invoice_id",
  authMiddleware,
  async (req, res) => {
    const { invoice_id } = req.params;

    try {
      const response = await axios.get(
        `https://www.zohoapis.in/invoice/v3/invoices/${invoice_id}?accept=pdf`,
        {
          headers: {
            Authorization: `Bearer ${await refreshAccessToken()}`,
            "X-com-zoho-invoice-organizationid": ORG_ID,
          },
          responseType: "arraybuffer", 
        }
      )
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice_${invoice_id}.pdf`
      );

      res.send(response.data);
    } catch (error) {
      console.error(
        "Error downloading invoice:",
        error.response?.data || error.message
      );
      res.status(500).json(error.response?.data || error.message);
    }
  }
);

export default router;
