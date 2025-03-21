import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const WATI_API_KEY = process.env.Wati_Access_Token;

export const sendTemplateMessage = async (phone, templateName, parameters) => {
  if (!phone || !templateName || !parameters) {
    throw new Error(
      "Phone number, template name, and parameters are required."
    );
  }

  try {
    const url = `https://live-mt-server.wati.io/415714/api/v1/sendTemplateMessage?whatsappNumber=${encodeURIComponent(
      phone
    )}`;

    const payload = {
      template_name: templateName,
      broadcast_name: "DynamicBroadcast", // Optional broadcast name
      parameters: parameters, // Expected format: [{ name: "1", value: "value1" }, ...]
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${WATI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(
      error.response?.data?.message || "Failed to send template message"
    );
  }
};
