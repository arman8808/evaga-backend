import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.modal.js";
import bcrypt from "bcrypt";
const options = {
  httpOnly: true,
  secure: true,
};
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
  const { name, email, phoneNumber, password, googleId } = req.body;

  if (!name || (!email && !phoneNumber) || (!password && !googleId)) {
    return res.status(400).json({ error: "Required fields missing" });
  }
  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }
    const newUser = new User({ name, email, phoneNumber, password, googleId });
    await newUser.save();
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      newUser._id,
      "user"
    );
    res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({ message: "User registered successfully" });
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
    const user = await User.findOne(isEmail ? { email: identifier } : { phoneNumber: identifier });
    
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Verify the password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id, 'user');

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({ message: "User logged in successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
const updateUserProfile = async (req, res) => {
  const { userId } = req.params;
  const { name, email, phoneNumber, password } = req.body;
  console.log(name, email, phoneNumber, password);

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
        return res.status(400).json({ error: "Phone number already in use" });
      }
      user.phoneNumber = phoneNumber.trim();
    }

    if (name && name.trim() !== "") user.name = name.trim();
    if (password && password.trim() !== "") {
      {
        const isSamePassword = await user.isPasswordCorrect(password.trim());
        console.log(isSamePassword);

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
    const user = await User.findById(userId).select(
      "-password -createdAt -updatedAt -refreshToken"
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

export {
  registerUser,
  loginUser,
  updateUserProfile,
  getOneUserProfile,
  deleteUserAccount,
  changePassword,
  logoutUser
};