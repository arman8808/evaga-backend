import User from "../modals/user.modal.js";
import Vender from "../modals/vendor.modal.js";

// const verifyController = async (req, res) => {
//   const { identifier, otp } = req.body;
// console.log(identifier, otp);

//   if (!identifier || !otp) {
//     return res.status(400).json({ error: "Identifier and OTP are required" });
//   }

//   const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

//   try {
//     const user = await Vender.findOne(
//       isEmail ? { email: identifier } : { phoneNumber: identifier }
//     );

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     if (user.resetOtp !== otp) {
//       return res.status(400).json({ error: "Invalid OTP" });
//     }

//     if (user.resetOtpExpires < Date.now()) {
//       return res.status(400).json({ error: "OTP has expired" });
//     }

//     user.resetOtp = null;
//     user.resetOtpExpires = null;
//     await user.save();

//     return res.status(200).json({
//       message: "OTP verified successfully",
//       userId: user._id,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };

const generateAccessAndRefereshTokens = async (userId, role) => {
  try {
    // Role-based model selection
    const roleConfig = {
      vendor: Vender,
      user: User,
    };

    const Model = roleConfig[role];
    if (!Model) {
      throw new ApiError(400, "Invalid role specified");
    }

    // Find the user/vendor based on the role
    const entity = await Model.findById(userId);
    if (!entity) {
      throw new ApiError(
        404,
        `${role === "vendor" ? "Vendor" : "User"} not found`
      );
    }

    // Generate tokens using the appropriate methods
    const accessToken = entity.generateAccessToken(role);
    const refreshToken = entity.generateRefreshToken(role);

    // Save the refresh token in the database
    entity.refreshToken = refreshToken;
    await entity.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const verifyController = async (req, res) => {
  const { identifier, otp, role } = req.body;
  console.log(identifier, otp, role);

  if (!identifier || !otp || !role) {
    return res
      .status(400)
      .json({ error: "Identifier, OTP, and role are required" });
  }

  const roleConfig = {
    vendor: Vender,
    user: User,
  };

  const Model = roleConfig[role];
  if (!Model) {
    return res.status(400).json({ error: "Invalid role specified" });
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

  try {
    const user = await Model.findOne(
      isEmail ? { email: identifier } : { phoneNumber: identifier }
    );

    if (!user) {
      return res
        .status(404)
        .json({ error: `${role === "vendor" ? "Vendor" : "User"} not found` });
    }

    if (user.Otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (user.OtpExpires < Date.now()) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    user.Otp = null;
    user.OtpExpires = null;
    await user.save();

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id,
      role
    );

    // Return success response with tokens
    return res.status(200).json({
      message: "OTP verified successfully",
      token: accessToken,
      userId: user._id,
      role:role
    });
  } catch (error) {
    console.error("Error in verifyController:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export { verifyController };
