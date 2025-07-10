import { OAuth2Client } from "google-auth-library";
import mongoose from "mongoose";
import User from "../modals/user.modal.js";
import path from "path";
import sendLoginAlert from "../utils/mailer.js";
import { sendEmail } from "../utils/emailService.js";
const options = {
  httpOnly: true,
  secure: true,
};
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const generateAccessAndRefereshTokens = async (userId, role) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken(role);
    const refreshToken = user.generateRefreshToken(role);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = async (req, res) => {
  const { name, email, phone, password, googleId } = req.body;

  if (!name || (!email && !phone) || (!password && !googleId)) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }
    const newUser = new User({
      name,
      email,
      phoneNumber: phone,
      password,
      googleId,
    });
    await newUser.save();
    await sendEmail(
      "userwelcomeemail",
      newUser?.email,
      "Welcome to Eevagga! Let’s Plan Your Perfect Event",
      { customerName: newUser?.name }
    );
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      newUser._id,
      "user"
    );
    res
      .status(201)
      // .cookie("accessToken", accessToken, options)
      // .cookie("refreshToken", refreshToken, options)
      .json({
        message: "User registered successfully",
        role: "user",
        token: accessToken,
        userId: newUser._id,
      });
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Server error" });
  }
};
const loginUser = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: "Email or phone number is required" });
  }
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

  try {
    const user = await User.findOne(
      isEmail ? { email: identifier } : { phoneNumber: identifier }
    );

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(400).json({
        error:
          "This account does not have a password. You may have signed in using Google. Please use that method to log in.",
      });
    }

    // Verify the password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id,
      "user"
    );

    return (
      res
        .status(200)
        // .cookie("accessToken", accessToken, options)
        // .cookie("refreshToken", refreshToken, options)
        .json({
          message: "User logged in successfully",
          role: "user",
          token: accessToken,
          userId: user._id,
        })
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const googleAuth = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Google token is required" });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { sub: googleId, email, name, picture } = payload;
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.profilePicture = user.profilePicture || picture;
        await user.save();
      }
    } else {
      user = new User({
        name,
        email,
        googleId,
        profilePicture: picture,
      });
      await user.save();
      await sendEmail(
        "userwelcomeemail",
        user?.email,
        "Welcome to Eevagga! Let’s Plan Your Perfect Event",
        { customerName: user?.name }
      );
    }

    const accessToken = user.generateAccessToken("user");
    const refreshToken = user.generateRefreshToken("user");

    return res.status(200).json({
      message: "User authenticated successfully",
      role: "user",
      token: accessToken,
      userId: user._id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Google authentication failed" });
  }
};
const updateUserProfile = async (req, res) => {
  const { userId } = req.params;
  const { name, email, phoneNumber, alternateNumber, password, faceBookLink } =
    req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (email && email.trim() !== "" && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ error: "Email already in use" });
      }
      user.email = email.trim();
    }
    if (
      phoneNumber &&
      phoneNumber.trim() !== "" &&
      phoneNumber !== user.phoneNumber
    ) {
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists) {
        return res.status(404).json({ error: "Phone number already in use" });
      }
      user.phoneNumber = phoneNumber.trim();
    }
    if (
      alternateNumber &&
      alternateNumber.trim() !== "" &&
      alternateNumber !== user.alternateNumber
    ) {
      const phoneExists = await User.findOne({ alternateNumber });
      if (phoneExists) {
        return res
          .status(400)
          .json({ error: "Alternate Phone number already in use" });
      }
      user.phoneNumber = phoneNumber.trim();
    }

    if (name && name.trim() !== "") user.name = name.trim();
    if (faceBookLink && faceBookLink.trim() !== "")
      user.faceBookLink = faceBookLink.trim();

    if (password && password.trim() !== "") {
      {
        const isSamePassword = await user.isPasswordCorrect(password.trim());

        if (!isSamePassword) {
          user.password = password.trim();
        }
      }
    }
    await user.save();
    res.status(200).json({ message: "User profile updated successfully" });
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Server error" });
  }
};
const getOneUserProfile = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId)
      .populate("userAddresses")
      .select(
        "-password -createdAt -updatedAt -refreshToken -Otp -OtpExpires -interestId -userInterestFilled -_id -googleId"
      );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Server error" });
  }
};
const deleteUserAccount = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
const changePassword = async (req, res) => {
  const { userId } = req.params;
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await user.isPasswordCorrect(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
const logoutUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByIdAndUpdate(userId, { refreshToken: null });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
const updateUserProfilePicture = async (req, res) => {
  const profilePic = req.file ? path.basename(req.file.path) : "";
  const userID = req.params.userId;
  if (!profilePic) {
    return res.status(400).json({ error: "Image is required" });
  }
  try {
    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const user = await User.findById(userID);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.profilePicture = profilePic;
    await user.save();
    res.status(200).json({
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    {
      console.error("Server error:", error);
      return res
        .status(500)
        .json({ error: "Server error", details: error.message });
    }
  }
};
const getAllUser = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = -1,
      search = "",
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const sortOption = { [sortBy]: sortOrder };

    const searchFilter = search
      ? { name: { $regex: search, $options: "i" } }
      : {};

    const skip = (pageNumber - 1) * pageSize;

    const users = await User.find(searchFilter)
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize)
      .populate("interestId", "interests -_id")
      .select("-refreshToken -updatedAt -createdAt -Otp -OtpExpires -password");

    if (!users || users.length === 0) {
      return res.status(200).json({ message: "No users found" });
    }
    const totalUsers = await User.countDocuments(searchFilter);

    return res.status(200).json({
      success: true,
      totalUsers,
      totalPages: Math.ceil(totalUsers / pageSize),
      currentPage: pageNumber,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);

    // Return a general server error status with the error message
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const getUserInterestStatus = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId).select("userInterestFilled -_id");
    if (!user || user.length === 0) {
      return res.status(404).json({ message: "No user found" });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
const setNewUserPassword = async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required" });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = newPassword;

    // Save changes
    await user.save();

    return res
      .status(200)
      .json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
export {
  registerUser,
  loginUser,
  updateUserProfile,
  getOneUserProfile,
  deleteUserAccount,
  changePassword,
  logoutUser,
  updateUserProfilePicture,
  getAllUser,
  getUserInterestStatus,
  setNewUserPassword,
  googleAuth,
};
