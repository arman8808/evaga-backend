import User from "../modals/user.modal.js";
import Vender from "../modals/vendor.modal.js";
import { sendEmail } from "../utils/emailService.js";
import sendEmailWithTemplete from "../utils/mailer.js";
import { sendTemplateMessage } from "./wati.controller.js";

const authController = async (req, res) => {
  const { identifier, role } = req.body;

  if (!identifier || !role) {
    return res
      .status(400)
      .json({ error: "Identifier (email/phone) and role are required" });
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const roleConfig = {
    vendor: {
      model: Vender,
      emailSubject: "Your OTP for Vendor Verification",
      emailBody: (otp) => `Your OTP is: ${otp}. It is valid for 15 minutes.`,
    },
    user: {
      model: User,
      emailSubject: "Your OTP for User Verification",
      emailBody: (otp) => `Your OTP is: ${otp}. It is valid for 15 minutes.`,
    },
  };

  // Verify role
  const config = roleConfig[role];
  if (!config) {
    return res.status(400).json({ error: "Invalid role specified" });
  }

  try {
    const user = await config.model.findOne(
      isEmail ? { email: identifier } : { phoneNumber: identifier }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.Otp = otp;
    user.OtpExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // await sendEmail(user.email, config.emailSubject, config.emailBody(otp));
    await sendEmail(
      "otpemail",
      user?.email,
      "Reset Your Password – OTP Inside!",
      {
        userName: user?.name,
        otp: otp,
      }
    );
    await sendTemplateMessage(user?.phoneNumber, "reset_password", [
      { name: "1", value: otp },
    ]);

    return res
      .status(200)
      .json({ message: "OTP sent to the registered email and Whatsapp" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export { authController };
