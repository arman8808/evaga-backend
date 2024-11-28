import mongoose from "mongoose";
import Vender from "../models/vender.modal.js";
import BankDetails from "../models/bank.modal.js";
import path from "path";
import venderDocument from "../models/document.modal.js";
import BookingCalender from "../models/booking.modal.js";
import BusinessDetails from "../models/Business.modal.js";
import { generateUniqueId } from "../utils/generateUniqueId.js";
import { calculateProfileCompletion } from "../utils/calculateVendorProfilePercentage.js";
import { error } from "console";
const options = {
  // httpOnly: true,
  // secure: true,
  httpOnly: true,
  secure: false, // Use true only in production with HTTPS
  sameSite: "None", // 'Lax', 'Strict', or 'None'
  maxAge: 24 * 60 * 60 * 1000,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
      .json({
        message: "User registered successfully",
        role: "vendor",
        token: accessToken,
        userId: newUser._id,
      });
  } catch (error) {
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
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Incorrect password" });
    }
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id,
      "vendor"
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        message: "User logged in successfully",
        role: "vendor",
        token: accessToken,
        userId: user._id,
      });
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
    alternatePhoneNumber,
    website,
    facebook,
    instagram,
  } = req.body;

  try {
    const user = await Vender.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

  
    if (email && email.trim() !== "") {
      if (email === user.email) {
        return res
          .status(400)
          .json({ error: "The provided email is the same as the current one" });
      }

      const emailExists = await Vender.findOne({
        email,
        _id: { $ne: userId }, 
      });
      if (emailExists) {
        return res.status(400).json({ error: "Email already in use" });
      }
      user.email = email.trim();
    }

 
    if (phoneNumber && phoneNumber.trim() !== "") {
      if (phoneNumber === user.phoneNumber) {
        return res.status(400).json({
          error: "The provided phone number is the same as the current one",
        });
      }

      const phoneExists = await Vender.findOne({
        phoneNumber,
        _id: { $ne: userId }, 
      });
      if (phoneExists) {
        return res.status(400).json({ error: "Phone number already in use" });
      }


      if (phoneNumber === alternatePhoneNumber) {
        return res.status(400).json({
          error: "Phone number and alternate phone number cannot be the same",
        });
      }

      user.phoneNumber = phoneNumber.trim();
    }

    if (alternatePhoneNumber && alternatePhoneNumber.trim() !== "") {
      if (alternatePhoneNumber === user.alternatePhoneNumber) {
        return res.status(400).json({
          error:
            "The provided alternate phone number is the same as the current one",
        });
      }

      const alternatePhoneNumberExists = await Vender.findOne({
        alternatePhoneNumber,
        _id: { $ne: userId }, 
      });
      if (alternatePhoneNumberExists) {
        return res.status(400).json({
          error: "Alternate Phone number already in use",
        });
      }

      if (alternatePhoneNumber === phoneNumber) {
        return res.status(400).json({
          error: "Phone number and alternate phone number cannot be the same",
        });
      }

      user.alternatePhoneNumber = alternatePhoneNumber.trim();
    }

    if (password && password.trim() !== "") {
      const isSamePassword = await user.isPasswordCorrect(password.trim());
      if (isSamePassword) {
        return res.status(400).json({
          error: "The new password must be different from the current password",
        });
      }

      // const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
      // if (!passwordRegex.test(password)) {
      //   return res.status(400).json({
      //     error:
      //       "Password must be at least 8 characters long, include one letter, one number, and one special character",
      //   });
      // }

      user.password = password.trim();
    }

    if (name && name.trim() !== "") user.name = name.trim();
    if (location && location.trim() !== "") user.location = location.trim();
    if (website && website.trim() !== "") user.website = website.trim();
    if (facebook && facebook.trim() !== "") user.facebook = facebook.trim();
    if (instagram && instagram.trim() !== "") user.instagram = instagram.trim();
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
  const { vendorID, documentId, documentName, documentType } = req.body;
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
            documentUrl: `documents/${document}`,
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
        documentId: "DOC-" + generateUniqueId(),
        documentName,
        documentUrl: `documents/${document}`,
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
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const uploadVenderBusinessDetails = async (req, res) => {
  const { vendorID } = req.params;
  const {
    businessId,
    typeOfBusiness,
    nameOfApplicant,
    udyamAadhaar,
    categoriesOfServices,
    businessAddress,
    state,
    panNumber,
    gstNumber,
    city,
    pincode,
    serviceableRadius,
  } = req.body;

  try {
    const vendor = await Vender.findById(vendorID);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    if (businessId) {
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({ error: "Invalid business ID" });
      }
      const existingDocument = await BusinessDetails.findById(businessId);
      if (!existingDocument) {
        return res.status(404).json({ error: "Business not found" });
      }
      const updatedBusiness = await BusinessDetails.findByIdAndUpdate(
        businessId,
        {
          $set: {
            typeOfBusiness,
            nameOfApplicant,
            udyamAadhaar,
            categoriesOfServices,
            businessAddress,
            state,
            panNumber,
            gstNumber,
            city,
            pincode,
            serviceableRadius,
          },
        },
        { new: true }
      );
      res.status(200).json({
        message: "Document updated successfully",
        document: updatedBusiness,
      });
    } else {
      if (
        !typeOfBusiness ||
        !nameOfApplicant ||
        !udyamAadhaar ||
        !categoriesOfServices ||
        !businessAddress ||
        !state ||
        !panNumber ||
        !gstNumber ||
        !city ||
        !pincode ||
        !serviceableRadius
      ) {
        return res.status(400).json({
          error:
            "All the following fields are required: typeOfBusiness, nameOfApplicant, udyamAadhaar, categoriesOfServices, businessAddress, state, panNumber, gstNumber, city, pincode, serviceableRadius",
        });
      }
      const newBusinessDetails = new BusinessDetails({
        vendorID,
        applicantID: "APP-" + generateUniqueId(),
        typeOfBusiness,
        nameOfApplicant,
        udyamAadhaar,
        categoriesOfServices,
        businessAddress,
        state,
        panNumber,
        gstNumber,
        city,
        pincode,
        serviceableRadius,
      });
      const savedBusiness = await newBusinessDetails.save();
      // vendor.businessDetails.push(savedBusiness._id);
      vendor.businessDetails = savedBusiness._id;
      await vendor.save();
      res.status(201).json({
        message: "Document uploaded successfully",
        document: savedBusiness,
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const addNewCategoryvenderBusinessDeatils = async (req, res) => {
  const { businessId } = req.params;
  const { categoriesOfServices } = req.body;
  try {
    const updatedBusinessCategory = await BusinessDetails.findByIdAndUpdate(
      businessId,
      {
        $push: {
          categoriesOfServices: { $each: categoriesOfServices },
        },
      },
      { new: true }
    );
    if (!updatedBusinessCategory) {
      return res
        .status(404)
        .json({ error: "No Business Details Find With This Id" });
    }
    res.status(201).json({ message: "Category Added Successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const updateVenderBio = async (req, res) => {
  const { vendorID } = req.params;
  const { bio } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(vendorID)) {
      return res.status(400).json({ error: "Invalid vendor ID" });
    }

    const vendor = await Vender.findById(vendorID);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    vendor.bio = bio || vendor.bio;
    await vendor.save();

    res.status(200).json({ message: "Vendor bio updated successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const updateVenderProfilePicture = async (req, res) => {
  const { vendorID } = req.params;
  const profilePic = req.file ? path.basename(req.file.path) : "";
  if (!profilePic) {
    return res.status(400).json({ error: "Image is required" });
  }
  try {
    if (!mongoose.Types.ObjectId.isValid(vendorID)) {
      return res.status(400).json({ error: "Invalid vendor ID" });
    }
    const vendor = await Vender.findById(vendorID);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    vendor.profilePicture = `profilePic/${profilePic}`;
    await vendor.save();
    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: vendor.profilePicture,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Server error", details: error.message });
  }
};
const updateVenderCalender = async (req, res) => {
  const { vendorID } = req.params;
  const { date, startTime, endTime, userID, bookedByVendor } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(vendorID)) {
      return res.status(400).json({ error: "Invalid vendor ID" });
    }
    const vendor = await Vender.findById(vendorID);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const existingBooking = await BookingCalender.findOne({
      vendor: vendorID,
      date,
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });
    if (existingBooking) {
      return res.status(400).json({ error: "Time slot is already booked" });
    }
    const booking = new BookingCalender({
      vendor: vendorID,
      date,
      startTime,
      endTime,
      user: bookedByVendor ? null : userID,
      bookedByVendor: !!bookedByVendor,
    });
    await booking.save();
    res.status(201).json({ message: "Booking added successfully", booking });
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({ error: "Server error", details: error.message });
  }
};

const getVendorProfilePercentage = async (req, res) => {
  const { vendorId } = req.params;
  if (!vendorId) {
    return res.status(404).json({ error: "No Vendor Id Is Provided" });
  }
  try {
    const vendor = await Vender.findById(vendorId)
      .populate("areaOfInterest")
      .populate("bankDetails")
      .populate("businessDetails")
      .populate("documents");
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    const profileCompletion = calculateProfileCompletion(vendor);
    res.json({
      profileCompletion,
    });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ error: "Server error", details: error.message });
  }
};
const getVenderProfileAllInOne = async (req, res) => {
  const { vendorId } = req.params;
  if (!vendorId) {
    return res.status(404).json({ message: "Vendor Id Not Provided" });
  }
  try {
    const vendor = await Vender.findById(vendorId)
      .populate("areaOfInterest")
      .populate("bankDetails")
      .populate({
        path: "businessDetails",
        populate: {
          path: "categoriesOfServices.category categoriesOfServices.subCategories",
        },
      })
      .populate("documents")
      .select("-refreshToken -createdAt -updatedAt");

    res.json({
      vendor,
      // bankDetails: vendor.bankDetails,
      // documents: vendor.documents,
      // businessDetails: vendor.businessDetails,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Server error", details: error.message });
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
  updateVenderBio,
  updateVenderProfilePicture,
  updateVenderCalender,
  uploadVenderBusinessDetails,
  addNewCategoryvenderBusinessDeatils,
  getVendorProfilePercentage,
  getVenderProfileAllInOne,
};
