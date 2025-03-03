import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const { CASHFREE_APP_ID, CASHFREE_SECRET_KEY } = process.env;
async function sendAadhaarOtp(aadhaarNumber) {
  const options = {
    method: "POST",
    url: "https://api.cashfree.com/verification/offline-aadhaar/otp",
    headers: {
      "x-client-id": CASHFREE_APP_ID,
      "x-client-secret": CASHFREE_SECRET_KEY,
      "Content-Type": "application/json",
    },
    data: {
      aadhaar_number: aadhaarNumber,
    },
  };

  try {
    const response = await axios(options);
    const { status, message, ref_id } = response.data;

    if (status === "SUCCESS") {
        return { success: true, message, ref_id };
      } else {
        console.log(message?.data,'adhar');
        
        return { success: false, message: `Failed to send OTP: ${message}` };
      }
  } catch (error) {
    // console.error("Error sending Aadhaar OTP:", error.message);
    throw error;
  }
}
async function verifyAadhaarOtp(otp, refId) {
  const options = {
    method: "POST",
    url: "https://api.cashfree.com/verification/offline-aadhaar/verify",
    headers: {
      "x-client-id": CASHFREE_APP_ID,
      "x-client-secret": CASHFREE_SECRET_KEY,
      "Content-Type": "application/json",
    },
    data: {
      otp: otp,
      ref_id: refId,
    },
  };

  try {
    const response = await axios(options);
    return response.data; // Return response data to the caller
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.error("Invalid OTP:", error.response.data.message);
      throw new Error(error.response.data.message || "Invalid OTP entered");
    } else {
      console.error("Error verifying OTP:", error.message);
      throw new Error("Error verifying OTP");
    }
  }
}

export { sendAadhaarOtp, verifyAadhaarOtp };
