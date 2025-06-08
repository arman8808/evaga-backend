import mongoose from "mongoose";
import Vender from "../modals/vendor.modal.js";
import BankDetails from "../modals/bank.modal.js";
import path from "path";
import venderDocument from "../modals/document.modal.js";
import BookingCalender from "../modals/booking.modal.js";
import BusinessDetails from "../modals/Business.modal.js";
import { generateUniqueId } from "../utils/generateUniqueId.js";
import { calculateProfileCompletion } from "../utils/calculateVendorProfilePercentage.js";
import { generateUsername } from "../utils/generateVendorUserName.js";
import sendEmailWithTemplete from "../utils/mailer.js";
import { verifyBankDetails } from "../utils/verifyBank.js";
import { verifyWithCashfree } from "../utils/verifyPanAndGst.js";
import { sendAadhaarOtp, verifyAadhaarOtp } from "../utils/verifyAadhar.js";
import { sendTemplateMessage } from "./wati.controller.js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
const s3Client = new S3Client({ region: process.env.AWS_REGION });
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

const registerVendor = async (req, res) => {
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
    const date = newUser.createdAt;
    const username = await generateUsername(newUser.name, date, Vender);

    newUser.userName = username;
    await newUser.save();
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      newUser._id,
      "vendor"
    );
    res
      .status(201)
      // .cookie("accessToken", accessToken, options)
      // .cookie("refreshToken", refreshToken, options)
      .json({
        message: "User registered successfully",
        role: "vendor",
        token: accessToken,
        userId: newUser._id,
      });
    await sendEmailWithTemplete(
      "vendorSignUp",
      newUser?.email,
      "Welcome to Eevgaa! Complete Your KYC to Get Started",
      {
        vendorName: newUser?.name,
        kycLink: "https://www.eevagga.com",
      }
    );
    await sendTemplateMessage(newUser?.phoneNumber, "vendor_sign_up_n", []);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const loginVendor = async (req, res) => {
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

    // Check if the profile is active
    if (!user.profileStatus) {
      return res
        .status(403)
        .json({ error: "Profile inactive. Please contact support." });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id,
      "vendor"
    );

    return res.status(200).json({
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

const updateVendorProfile = async (req, res) => {
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
      const phoneExists = await Vender.findOne({ phoneNumber });
      if (phoneExists) {
        return res.status(400).json({ error: "Phone number already in use" });
      }
      user.phoneNumber = phoneNumber.trim();
    }
    if (
      alternatePhoneNumber &&
      alternatePhoneNumber.trim() !== "" &&
      alternatePhoneNumber !== user.alternatePhoneNumber
    ) {
      const phoneExists = await Vender.findOne({ alternatePhoneNumber });
      if (phoneExists) {
        return res
          .status(400)
          .json({ error: "Alternate Phone number already in use" });
      }
      user.alternatePhoneNumber = alternatePhoneNumber.trim();
    }

    // if (email && email.trim() !== "") {
    //   if (email === user.email) {
    //     return res
    //       .status(400)
    //       .json({ error: "The provided email is the same as the current one" });
    //   }

    //   const emailExists = await Vender.findOne({
    //     email,
    //     _id: { $ne: userId },
    //   });
    //   if (emailExists) {
    //     return res.status(400).json({ error: "Email already in use" });
    //   }
    //   user.email = email.trim();
    // }

    // if (phoneNumber && phoneNumber.trim() !== "") {
    //   if (phoneNumber === user.phoneNumber) {
    //     return res.status(400).json({
    //       error: "The provided phone number is the same as the current one",
    //     });
    //   }

    //   const phoneExists = await Vender.findOne({
    //     phoneNumber,
    //     _id: { $ne: userId },
    //   });
    //   if (phoneExists) {
    //     return res.status(400).json({ error: "Phone number already in use" });
    //   }

    //   if (phoneNumber === alternatePhoneNumber) {
    //     return res.status(400).json({
    //       error: "Phone number and alternate phone number cannot be the same",
    //     });
    //   }

    //   user.phoneNumber = phoneNumber.trim();
    // }

    // if (alternatePhoneNumber && alternatePhoneNumber.trim() !== "") {
    //   if (alternatePhoneNumber === user.alternatePhoneNumber) {
    //     return res.status(400).json({
    //       error:
    //         "The provided alternate phone number is the same as the current one",
    //     });
    //   }

    //   const alternatePhoneNumberExists = await Vender.findOne({
    //     alternatePhoneNumber,
    //     _id: { $ne: userId },
    //   });
    //   if (alternatePhoneNumberExists) {
    //     return res.status(400).json({
    //       error: "Alternate Phone number already in use",
    //     });
    //   }

    //   if (alternatePhoneNumber === phoneNumber) {
    //     return res.status(400).json({
    //       error: "Phone number and alternate phone number cannot be the same",
    //     });
    //   }

    //   user.alternatePhoneNumber = alternatePhoneNumber.trim();
    // }

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
const updateProfileStatus = async (req, res) => {
  const { venderID, profileStatus } = req.body;

  if (!venderID) {
    return res.status(400).json({
      error: "Invalid request. Please provide a valid venderID.",
    });
  }

  try {
    const updatedVendor = await Vender.findOneAndUpdate(
      { _id: venderID },
      { profileStatus },
      { new: true }
    );

    if (!updatedVendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    res.status(200).json({
      message: "Profile status updated successfully.",
    });
  } catch (error) {
    console.error("Error updating profile status:", error);
    res.status(500).json({
      message: "An error occurred while updating profile status.",
      error: error.message,
    });
  }
};

const getOneVendorProfile = async (req, res) => {
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
const deleteVendorAccount = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await Vender.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.status(200).json({ message: "Vendor account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
const changeVendorPassword = async (req, res) => {
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
const logoutVendor = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await Vender.findByIdAndUpdate(userId, { refreshToken: null });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res
      .status(200)
      // .clearCookie("accessToken", options)
      // .clearCookie("refreshToken", options)
      .json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const updateVendorBankDetails = async (req, res) => {
  const { vendorID } = req.params;
  const { accountNumber, bankName, ifscCode, accountType } = req.body;

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
      const verificationResult = await verifyBankDetails(
        accountNumber,
        ifscCode
      );

      if (verificationResult.account_status !== "VALID") {
        return res.status(400).json({
          error: "Bank account verification failed",
          details: verificationResult.message,
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
        vendorId: vendor._id,
      });
      await newBankDetails.save();
      vendor.bankDetails = newBankDetails._id;
      await vendor.save();
      return res.status(201).json({
        message: "Bank details verified and updated successfully.",
        bankDetails: newBankDetails,
      });
    } else {
      const verificationResult = await verifyBankDetails(
        accountNumber,
        ifscCode
      );

      if (verificationResult?.account_status !== "VALID") {
        return res.status(400).json({
          error: "Bank account verification failed",
          details: verificationResult?.message,
        });
      }

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
        message: "Bank details verified and updated successfully.",
        bankDetails: updatedBankDetails,
      });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const uploadVendorDocuments = async (req, res) => {
  const document = req.file ? path.basename(req.file.path) : "";
  const { vendorID } = req.params;
  const { documentId, documentName, documentType, adminId } = req.body;
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
      const updatedFields = {};
      if (documentName) updatedFields.documentName = documentName;
      if (document) updatedFields.documentUrl = `documents/${document}`;
      if (documentType) updatedFields.documentType = documentType;
      if (adminId) updatedFields.adminId = adminId;
      if (documentType) updatedFields.status = "pending";

      const updatedDocument = await venderDocument.findByIdAndUpdate(
        documentId,
        { $set: updatedFields },
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
        adminId,
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
const uploadVendorBusinessDetails = async (req, res) => {
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

    const shouldUpdateVerificationStatus = (fieldsToCheck, existingDetails) => {
      const updates = {};
      let requiresVerification = false;

      if (
        fieldsToCheck.includes("udyamAadhaar") &&
        udyamAadhaar !== existingDetails.udyamAadhaar
      ) {
        updates.adharVerificationStatus = "Pending";
        requiresVerification = true;
      }
      if (
        fieldsToCheck.includes("panNumber") &&
        panNumber !== existingDetails.panNumber
      ) {
        updates.panVerificationStatus = "Pending";
        requiresVerification = true;
      }
      if (
        fieldsToCheck.includes("gstNumber") &&
        gstNumber !== existingDetails.gstNumber
      ) {
        updates.gstVerificationStatus = "Pending";
        requiresVerification = true;
      }

      return { updates, requiresVerification };
    };

    if (vendor.businessDetails) {
      const existingBusinessDetails = await BusinessDetails.findById(
        vendor.businessDetails
      );

      if (existingBusinessDetails) {
        const { updates, requiresVerification } =
          shouldUpdateVerificationStatus(
            ["udyamAadhaar", "panNumber", "gstNumber"],
            existingBusinessDetails
          );

        const updatedFields = {
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
        };

        if (requiresVerification) {
          Object.assign(updatedFields, updates);
        }

        const updatedBusiness = await BusinessDetails.findByIdAndUpdate(
          vendor.businessDetails,
          {
            $set: updatedFields,
          },
          { new: true }
        );

        return res.status(200).json({
          message: "Business details updated successfully",
          document: updatedBusiness,
        });
      }
    }

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

    vendor.businessDetails = savedBusiness._id;
    await vendor.save();

    res.status(201).json({
      message: "Business details added successfully",
      document: savedBusiness,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const addNewCategoryvendorBusinessDeatils = async (req, res) => {
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
const updateVendorBio = async (req, res) => {
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
const updateVendorProfilePicture = async (req, res) => {
  const { vendorID } = req.params;
  const profilePic = req.file ? req.file.key : ""; // Use S3 object key

  if (!profilePic) {
    return res.status(400).json({ error: "Image is required" });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(vendorID)) {
      return res.status(400).json({ error: "Invalid vendor ID" });
    }

    // Find the vendor
    const vendor = await Vender.findById(vendorID);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Delete the old profile picture from S3 if it exists
    const oldProfilePic = vendor.profilePicture;
    if (oldProfilePic) {
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME, // Your S3 bucket name
        Key: oldProfilePic, // S3 object key
      };

      try {
        await s3Client.send(new DeleteObjectCommand(deleteParams));
        console.log(`Deleted old profile picture: ${oldProfilePic}`);
      } catch (s3Error) {
        console.error(
          "Failed to delete old profile picture from S3:",
          s3Error.message
        );
      }
    }

    // Update the vendor's profile picture with the new one
    vendor.profilePicture = profilePic;
    await vendor.save();

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: vendor.profilePicture,
    });
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const updateVendorCalender = async (req, res) => {
  const { vendorID } = req.params;
  const { startDate, endDate, startTime, endTime, userID, bookedByVendor } =
    req.body;
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
      startDate,
      endDate,
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });
    if (existingBooking) {
      return res.status(400).json({ error: "Time slot is already booked" });
    }
    const booking = new BookingCalender({
      vendor: vendorID,
      startDate,
      endDate,
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
const editVendorCalender = async (req, res) => {
  const { bookingId } = req.params;
  const { startDate, endDate, startTime, endTime } = req.body;

  try {
    const existingBooking = await BookingCalender.findById(bookingId);

    if (!existingBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const updatedBooking = {
      startDate: startDate || existingBooking.startDate,
      endDate: endDate || existingBooking.endDate,
      startTime: startTime || existingBooking.startTime,
      endTime: endTime || existingBooking.endTime,
    };

    const booking = await BookingCalender.findByIdAndUpdate(
      bookingId,
      { $set: updatedBooking },
      { new: true }
    );

    return res.json({ message: "Booking Updated Successfully" });
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
    return res
      .status(500)
      .json({ error: "Server error", details: error.message });
  }
};
const getVendorProfileAllInOne = async (req, res) => {
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
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Server error", details: error.message });
  }
};
const getBookingByMonth = async (req, res) => {
  const { vendorId } = req.params;
  const { month, year } = req.query;

  try {
    if (!vendorId || !month || !year) {
      return res.status(400).json({
        error: "Invalid input. Please provide vendorId, month, and year.",
      });
    }

    const yearNum = Number(year);
    const monthNum = Number(month) - 1;

    if (isNaN(yearNum) || isNaN(monthNum)) {
      console.error("Invalid year or month:", { year, month });
      throw new Error("Invalid year or month input");
    }

    const startDate = new Date(Date.UTC(yearNum, monthNum, 1));
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const bookings = await BookingCalender.find({
      vendor: new mongoose.Types.ObjectId(vendorId),
      $or: [
        {
          startDate: { $gte: startDate, $lt: endDate },
        },
        {
          endDate: { $gte: startDate, $lt: endDate },
        },
        {
          startDate: { $lte: startDate },
          endDate: { $gte: endDate },
        },
      ],
    });

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Server error", details: error.message });
  }
};
const setNewVendorPassword = async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required" });
  }

  try {
    const user = await Vender.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Set the new password
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
const acceptTermsAndConditions = async (req, res) => {
  const { vendorId } = req.params;
  try {
    const vendor = await Vender.findByIdAndUpdate(
      vendorId,
      { $set: { termsAccepted: true, termsAcceptedAt: Date.now() } },
      { new: true }
    );

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    return res.status(200).json({ message: "Terms and conditions Accepted" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const verifyVendorStatus = async (req, res) => {
  const { vendorId } = req.params;
  try {
    const vendor = await Vender.findByIdAndUpdate(
      vendorId,
      { $set: { verificationStatus: true } },
      { new: true }
    );

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    return res
      .status(200)
      .json({ message: "Vendor verification status updated" });
  } catch (error) {
    console.error("Error verifying vendor status:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const verifyVendorDetails = async (req, res) => {
  const { vendorId } = req.params;
  const { type } = req.body; // Type should be 'pan' or 'gst'

  if (!vendorId) {
    return res.status(400).json({
      success: false,
      message: "Vendor ID is required",
    });
  }

  if (!type || !["pan", "gstin"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Type is required and must be 'pan' or 'gst'",
    });
  }

  try {
    const fieldName = type === "pan" ? "panNumber" : "gstNumber";

    const businessDetails = await BusinessDetails.findOne({
      vendorID: vendorId,
    }).select(`${fieldName} nameOfApplicant`);

    if (!businessDetails || !businessDetails[fieldName]) {
      return res.status(404).json({
        success: false,
        message: `Vendor or ${type.toUpperCase()} not found`,
      });
    }

    const value = businessDetails[fieldName];
    const name = businessDetails?.nameOfApplicant;
    const result = await verifyWithCashfree(type, value, name);
    const vendor = await BusinessDetails.findOne({ vendorID: vendorId });
    if (type === "pan") {
      if (result && result.valid === true) {
        vendor.panVerificationStatus = "Verified";
        await vendor.save();
      } else {
        vendor.panVerificationStatus = "Rejected";
        await vendor.save();
        return res.status(400).json({
          success: false,
          error: "PAN verification failed. Please check the provided details.",
        });
      }
    } else if (type === "gstin") {
      if (result && result.valid) {
        vendor.gstVerificationStatus = "Verified";
        await vendor.save();
      } else {
        vendor.gstVerificationStatus = "Rejected";
        await vendor.save();
        return res.status(400).json({
          success: false,
          error: "GST verification failed. Please check the provided details.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      type,
      value,
      verificationResult: result,
    });
  } catch (error) {
    console.error(`Error verifying ${type.toUpperCase()}:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const verifyVendorGst = async (req, res) => {
  const { vendorId } = req.params;

  if (!vendorId) {
    return res.status(400).json({
      success: false,
      message: "Vendor ID is required",
    });
  }

  try {
    const businessDetails = await BusinessDetails.findOne({
      vendorID: vendorId,
    }).select("gstNumber");

    if (!businessDetails || !businessDetails.gstNumber) {
      return res.status(404).json({
        success: false,
        message: "Vendor or Gst not found",
      });
    }
    const result = await verifyWithCashfree("pan", businessDetails.gstNumber);
    return res.status(200).json({
      success: true,
      pan: businessDetails.gstNumber,
    });
  } catch (error) {
    console.error("Error in gstNumber:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const sendaadharotp = async (req, res) => {
  const { vendorId } = req.params;

  try {
    const businessDetails = await BusinessDetails.findOne({
      vendorID: vendorId,
    }).select(`udyamAadhaar`);

    if (!businessDetails || !businessDetails?.udyamAadhaar) {
      return res.status(404).json({
        success: false,
        message: `Vendor Udyam Aadhaar not found`,
      });
    }

    const result = await sendAadhaarOtp(businessDetails?.udyamAadhaar);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message, // Return the error message from the function
      });
    }

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    // console.error(`Error verifying `, error.response.data?.message);
    return res.status(500).json({
      success: false,
      error:
        error.response.data?.message || "something went wrong please try later",
    });
  }
};

const verifyaadharotp = async (req, res) => {
  const { vendorId } = req.params;
  const { Otp, RefId } = req.body;

  if (!Otp || !RefId) {
    return res.status(400).json({ message: "Otp and RefId are required." });
  }

  try {
    const response = await verifyAadhaarOtp(Otp, RefId);

    if (response && response.status === "VALID") {
      const vendor = await BusinessDetails.findOne({ vendorID: vendorId });
      vendor.adharVerificationStatus = "Verified";
      await vendor.save();
      return res.status(200).json({
        message: response.message,
        ref_id: response.ref_id,
        name: response.name,
        address: response.address,
        dob: response.dob,
        gender: response.gender,
        status: response.status,
      });
    } else {
      return res.status(400).json({
        message: response.message || "Aadhaar verification failed",
      });
    }
  } catch (error) {
    console.error("Error verifying Aadhaar OTP:", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
const getVendorPinCode = async (req, res) => {
  const { vendorId } = req.params;

  try {
    const vendor = await Vender.findOne({ _id: vendorId }).populate({
      path: "businessDetails",
      select: "pincode serviceableRadius",
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (!vendor.businessDetails) {
      return res.status(404).json({
        success: false,
        message: "Business details not found",
      });
    }

    const { pincode, serviceableRadius } = vendor.businessDetails;
    res.status(200).json({
      success: true,
      pincode,
      serviceableRadius,
    });
  } catch (error) {
    console.error("Error fetching vendor pincode:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const getServiceableRadius = async (req, res) => {
  const { vendorId } = req.params;
  try {
    const vendor = await Vender.findOne({ _id: vendorId }).populate({
      path: "businessDetails",
      select: "serviceableRadius",
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (!vendor.businessDetails) {
      return res.status(404).json({
        success: false,
        message: "Business details not found",
      });
    }

    const { serviceableRadius } = vendor.businessDetails;
    res.status(200).json({
      success: true,
      serviceableRadius,
    });
  } catch (error) {
    console.error("Error fetching serviceableRadius:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export {
  registerVendor,
  loginVendor,
  logoutVendor,
  changeVendorPassword,
  deleteVendorAccount,
  getOneVendorProfile,
  updateVendorProfile,
  updateVendorBankDetails,
  uploadVendorDocuments,
  updateVendorBio,
  updateVendorProfilePicture,
  updateVendorCalender,
  uploadVendorBusinessDetails,
  addNewCategoryvendorBusinessDeatils,
  getVendorProfilePercentage,
  getVendorProfileAllInOne,
  getBookingByMonth,
  editVendorCalender,
  setNewVendorPassword,
  acceptTermsAndConditions,
  verifyVendorStatus,
  verifyVendorDetails,
  verifyVendorGst,
  sendaadharotp,
  verifyaadharotp,
  updateProfileStatus,
  getVendorPinCode,
  getServiceableRadius,
};
