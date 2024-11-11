import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Vender from "../models/vender.modal.js";
import BankDetails from "../models/bank.modal.js";
import path from "path";
import venderDocument from "../models/document.modal.js";
import { generateUniqueId } from "../utils/generateUniqueId.js";
const options = {
  httpOnly: true,
  secure: true,
};
const generateAccessAndRefereshTokens = async (userId, role) => {
  try {
    const user = await Vender.findById(userId);
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

const registerVender = async (req, res) => {
  const {
    name,
    email,
    phoneNumber,
    password,
    location,
    areaOfInterest,
    yearOfExperience,
  } = req.body;

  if (!name || (!email && !phoneNumber) || (!password && !googleId)) {
    return res.status(400).json({ error: "Required fields missing" });
  }
  try {
    const existingUser = await Vender.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }
    const newUser = new Vender({
      venderID: "VID-" + generateUniqueId(),
      name,
      email,
      phoneNumber,
      password,
      location,
      areaOfInterest,
      yearOfExperience,
    });
    await newUser.save();
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      newUser._id,
      "vendor"
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

const loginVender = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: "Email or phone number is required" });
  }
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

  try {
    const user = await Vender.findOne(
      isEmail ? { email: identifier } : { phoneNumber: identifier }
    );

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Verify the password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id,
      "vendor"
    );

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

const updateVenderProfile = async (req, res) => {
  const { userId } = req.params;
  const {
    name,
    email,
    phoneNumber,
    password,
    location,
    areaOfInterest,
    yearOfExperience,
  } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (email && email.trim() !== "" && email !== user.email) {
      const emailExists = await Vender.findOne({ email });
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

        if (!isSamePassword) {
          user.password = password.trim();
        }
      }
    }

    if (location && location.trim() !== "") user.location = location.trim();
    if (areaOfInterest && areaOfInterest.trim() !== "")
      user.areaOfInterest = areaOfInterest.trim();
    if (yearOfExperience && yearOfExperience.trim() !== "")
      user.yearOfExperience = yearOfExperience.trim();
    await user.save();
    res.status(200).json({ message: "User profile updated successfully" });
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Server error" });
  }
};
const getOneVenderProfile = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await Vender.findById(userId).select(
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
const deleteVenderAccount = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await Vender.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
const changeVenderPassword = async (req, res) => {
  const { userId } = req.params;
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await Vender.findById(userId);

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
const logoutVender = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await Vender.findByIdAndUpdate(userId, { refreshToken: null });
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

const updateVenderBankDetails = async (req, res) => {
  const { vendorID, accountNumber, bankName, ifscCode, accountType } = req.body;

  try {
    const vendor = await Vender.findById(vendorID);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    const existingBankDetails = vendor.bankDetails || {};
    if (!vendor.bankDetails) {
      if (!accountNumber || !bankName || !ifscCode || !accountType) {
        return res.status(400).json({
          error: "All bank details fields are required for initial setup",
        });
      }
      const bankDetailsData = {
        accountNumber,
        bankName,
        ifscCode,
        accountType,
      };
      const newBankDetails = new BankDetails({
        ...bankDetailsData,
        vendorID: vendor._id,
      });
      await newBankDetails.save();
      vendor.bankDetails = newBankDetails._id;
      await vendor.save();
      return res.status(201).json({
        message: "Bank details added successfully",
        bankDetails: newBankDetails,
      });
    } else {
      const bankDetailsData = {
        accountNumber: accountNumber || existingBankDetails.accountNumber,
        bankName: bankName || existingBankDetails.bankName,
        ifscCode: ifscCode || existingBankDetails.ifscCode,
        accountType: accountType || existingBankDetails.accountType,
      };
      const updatedBankDetails = await BankDetails.findByIdAndUpdate(
        vendor.bankDetails,
        { $set: bankDetailsData },
        { new: true }
      );
      return res.status(200).json({
        message: "Bank details updated successfully",
        bankDetails: updatedBankDetails,
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const uploadVendorDocuments = async (req, res) => {
  const document = req.file ? path.basename(req.file.path) : "";
  const {
    vendorID,
    documentId,
    documentName,
    documentType,
  } = req.body;
  console.log(documentId,'documentId');
  
  try {
    const vendor = await Vender.findById(vendorID);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    if (documentId) {
      if (!mongoose.Types.ObjectId.isValid(documentId)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }
      const existingDocument = await venderDocument.findById(documentId);
      if (!existingDocument) {
        return res.status(404).json({ error: "Document not found" });
      }
      const updatedDocument = await venderDocument.findByIdAndUpdate(
        documentId,
        {
          $set: {
            documentName,
            documentUrl: document,
            documentType,
          },
        },
        { new: true }
      );
      res.status(200).json({
        message: "Document updated successfully",
        document: updatedDocument,
      });
    } else {
      if (!documentName || !documentType) {
        return res.status(400).json({
          error: "Document name, URL, and type are required for new documents",
        });
      }
      const newDocument = new venderDocument({
        vendorID,
        documentId:"DOC-"+generateUniqueId(),
        documentName,
        documentUrl: document,
        documentType,
        status: "pending",
      });
      const savedDocument = await newDocument.save();
      vendor.documents.push(savedDocument._id);
      await vendor.save();
      res.status(201).json({
        message: "Document uploaded successfully",
        document: savedDocument,
      });
    }
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export {
  registerVender,
  loginVender,
  logoutVender,
  changeVenderPassword,
  deleteVenderAccount,
  getOneVenderProfile,
  updateVenderProfile,
  updateVenderBankDetails,
  uploadVendorDocuments,
};
