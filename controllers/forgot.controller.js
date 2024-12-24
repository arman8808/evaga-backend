import { error } from "console";
import admin from "../firebase/firebase.js";
import Vender from "../modals/vendor.modal.js";
import { sendEmail } from "../utils/emailService.js";

const authController = async (req, res) => {
  const { identifier } = req.body;
  console.log(identifier);
  if (!identifier) {
    return res.status(400).json({ error: "Email or phone number is required" });
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

  try {
    // Check user existence (your logic here)
    const user = await Vender.findOne(
      isEmail ? { email: identifier } : { phoneNumber: identifier }
    );

    // const user = await Vender.findOne({
    //   $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    // });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send OTP
    //     if (/^[0-9]+$/.test(emailOrPhone)) {
    //       const customToken = await admin
    //         .auth()
    //         .createCustomToken(user.phoneNumber);
    //       console.log("Custom token generated for phone:", customToken);
    //       return res.status(200).json({ message: "OTP sent to phone" });
    //     } else {
    //       await sendEmail(
    //         emailOrPhone,
    //         "Your Password Reset OTP for Evaga Entertainment",
    //         `Dear Customer,

    // We received a request to reset your password for your Evaga Entertainment Pvt Ltd account. Please use the One-Time Password (OTP) below to complete the process:

    // 🔒 Your OTP:${otp}

    // This OTP is valid for the next 10 minutes. For your account’s safety, please do not share this code with anyone.

    // If you didn’t request a password reset, simply ignore this email—your account is safe and secure.

    // For any questions or further assistance, feel free to contact us at info@evagaentertainment.com.

    // Thank you for being a valued member of the Evaga Entertainment community!

    // Best regards,
    // The Evaga Entertainment Team

    // ` // Email body
    //       );
    //       return res.status(200).json({ message: "OTP sent to Registered Email" });
    //     }

    await sendEmail(
      user.email,
      "Your Password Reset OTP for Evaga Entertainment",
      `Dear Customer,

We received a request to reset your password for your Evaga Entertainment Pvt Ltd account. Please use the One-Time Password (OTP) below to complete the process:

🔒 Your OTP:${otp}

This OTP is valid for the next 10 minutes. For your account’s safety, please do not share this code with anyone.

If you didn’t request a password reset, simply ignore this email—your account is safe and secure.

For any questions or further assistance, feel free to contact us at info@evagaentertainment.com.

Thank you for being a valued member of the Evaga Entertainment community!

Best regards,
The Evaga Entertainment Team

` // Email body
    );
    return res.status(200).json({ message: "OTP sent to Registered Email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export { authController };
