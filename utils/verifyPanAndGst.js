import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const verifyWithCashfree = async (type, value, name) => {
  const baseUrl = "https://api.cashfree.com/verification";
  const { CASHFREE_APP_ID, CASHFREE_SECRET_KEY } = process.env;


  try {
    if (!type || !value || !name) {
      throw new Error("Type, value, and name are required for verification.");
    }

    let endpoint;
    let payload = { [type]: value };
    if (type === "pan") {
      endpoint = "/pan";
      payload.name = name;
    } else if (type === "gstin") {
      endpoint = "/gstin";
      payload = { GSTIN: value.trim(), business_name: name };
    } else {
      throw new Error(
        "Invalid verification type. Only 'pan' and 'gstin' are supported."
      );
    }
    // console.log(payload);

    const response = await axios.post(`${baseUrl}${endpoint}`, payload, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "Content-Type": "application/json",
      },
    });
// console.log(response?.data,response?.data?.valid);

    return response?.data;
  } catch (error) {
    console.error("Error in verifyWithCashfree:", {
      message: error.message,
      response: error.response?.data,
    });
  }
};

export { verifyWithCashfree };
