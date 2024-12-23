import admin from "../firebase/firebase.js";
import Vender from "../modals/vendor.modal.js";

const authController = async (req, res) => {
  const { emailOrPhone } = req.body;
  console.log(emailOrPhone);

  try {
    // Check user existence (your logic here)
    const user = await Vender.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Save OTP in DB or
    console.log(otp);

    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    // Send OTP
    if (/^[0-9]+$/.test(emailOrPhone)) {
      const customToken = await admin
        .auth()
        .createCustomToken(user.phoneNumber);
      console.log("Custom token generated for phone:", customToken);
      return res.status(200).json({ message: "OTP sent to phone" });
    } else {
      // Email OTP (placeholder)
      // Add your email-sending logic here, e.g., using Nodemailer
      res.status(200).json({ message: "OTP sent to email" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export { authController };
