import { Cashfree } from "cashfree-pg";
import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

// Configure Cashfree credentials
// Cashfree.XClientId = process.env.CASHFREE_APP_ID;
// Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
// Cashfree.XEnvironment =
//   process.env.CASHFREE_ENV === "PROD"
//     ? Cashfree.Environment.PRODUCTION
//     : Cashfree.Environment.SANDBOX;

// export default Cashfree;
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,  // Add these to .env file
  key_secret: process.env.RAZORPAY_KEY_SECRET
});