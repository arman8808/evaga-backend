import Vender from "../modals/vendor.modal.js";

const verifyController = async (req, res) => {
  const { identifier, otp } = req.body;
console.log(identifier, otp);

  if (!identifier || !otp) {
    return res.status(400).json({ error: "Identifier and OTP are required" });
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

  try {
    const user = await Vender.findOne(
      isEmail ? { email: identifier } : { phoneNumber: identifier }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    return res.status(200).json({
      message: "OTP verified successfully",
      userId: user._id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export { verifyController };
