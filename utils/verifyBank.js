import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const CASHFREE_BASE_URL = "https://api.cashfree.com";

const verifyBankDetails = async (bankAccount, ifsc) => {
  const { CASHFREE_APP_ID, CASHFREE_SECRET_KEY } = process.env;
console.log(bankAccount, ifsc);

  try {
    const response = await axios.post(
      `https://api.cashfree.com/verification/bank-account/sync`,
      {
        bank_account: bankAccount,
        ifsc: ifsc,
      },
      {
        headers: {
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );



    return response?.data;
  } catch (error) {
    console.error("Error verifying bank details:", {
      message: error.message,
      response: error.response?.data,
      error
    });
  
  }
};

// Export the function for use in other modules
export { verifyBankDetails };
