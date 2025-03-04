import Vender from "../modals/vendor.modal.js";
import venderDocument from "../modals/document.modal.js";
import { calculateProfileCompletion } from "../utils/calculateVendorProfilePercentage.js";
import BankDetails from "../modals/bank.modal.js";
import BusinessDetails from "../modals/Business.modal.js";
import { generateUniqueId } from "../utils/generateUniqueId.js";
import mongoose from "mongoose";
import path from "path";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import User from "../modals/user.modal.js";
import OrderModel from "../modals/order.modal.js";
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const getAllVendorWithThereProfileStatusAndService = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const searchTerm = req.query.search || "";
  const filter = req.query.filter || "All Vendors";

  try {
    const matchStage = {
      $and: [
        filter === "Verified Vendors"
          ? { verificationStatus: true }
          : filter === "Registered Vendors"
          ? { verificationStatus: false }
          : {}, // No additional match for "all"
        {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { phoneNumber: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
            { userName: { $regex: searchTerm, $options: "i" } },
          ],
        },
      ].filter(Boolean),
    };

    const pipeline = [
      searchTerm || filter !== "all" ? { $match: matchStage } : null, // Apply $match only if searchTerm or filter is specified
      {
        $lookup: {
          from: "vendorservicelisitingforms",
          localField: "_id",
          foreignField: "vendorId",
          as: "serviceListing",
        },
      },
      {
        $unwind: {
          path: "$serviceListing",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          numberOfServices: {
            $cond: {
              if: { $isArray: "$serviceListing.services" },
              then: { $size: "$serviceListing.services" },
              else: 0,
            },
          },
        },
      },
      {
        $lookup: {
          from: "businessdetails",
          localField: "_id",
          foreignField: "vendorID",
          as: "businessDetails",
        },
      },
      {
        $unwind: {
          path: "$businessDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$businessDetails.categoriesOfServices",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "businessDetails.categoriesOfServices.category",
          foreignField: "_id",
          as: "businessDetails.categoriesOfServices.category",
        },
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "businessDetails.categoriesOfServices.subCategories",
          foreignField: "_id",
          as: "businessDetails.categoriesOfServices.subCategories",
        },
      },
      {
        $group: {
          _id: "$_id",
          vendorData: { $first: "$$ROOT" },
          categoriesOfServices: {
            $push: "$businessDetails.categoriesOfServices",
          },
        },
      },
      {
        $addFields: {
          "vendorData.businessDetails.categoriesOfServices":
            "$categoriesOfServices",
        },
      },
      {
        $replaceRoot: {
          newRoot: "$vendorData",
        },
      },
      {
        $project: {
          serviceListing: 0,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ].filter(Boolean); // Remove null values from the array

    const vendorsWithServiceData = await Vender.aggregate(pipeline);

    const totalVendors = await Vender.countDocuments();

    const enrichedVendors = vendorsWithServiceData.map((vendor) => {
      const profileCompletion = calculateProfileCompletion(vendor);
      return { ...vendor, profileCompletion };
    });

    if (enrichedVendors.length === 0) {
      return res.status(200).json({ message: "No vendors found" });
    }

    res.json({
      message: "Successfully Fetched Data",
      totalVendors,
      totalPages: Math.ceil(totalVendors / limit),
      currentPage: page,
      data: enrichedVendors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const vendorVerifyDocument = async (req, res) => {
  const { documentId } = req.params;
  if (!documentId) {
    return res.status(400).json({ error: "Document ID is required" });
  }
  const { verifiedAt, verifiedBy } = req.body;
  try {
    const document = await venderDocument.findOneAndUpdate(
      { documentId: documentId },
      {
        $set: {
          status: "verified",
          verifiedBy: verifiedBy,
          verifiedAt: verifiedAt,
        },
      },
      { new: true }
    );
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.status(200).json({ message: "Document Verified Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const updateVendorBankDetailsByAdmin = async (req, res) => {
  const { vendorID } = req.params;
  const { accountNumber, bankName, ifscCode, accountType } = req.body;
  const adminId = req.user._id;

  try {
    const vendor = await Vender.findById(vendorID);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Check if bank details exist
    const existingBankDetails = vendor.bankDetails
      ? await BankDetails.findById(vendor.bankDetails)
      : null;

    if (!existingBankDetails) {
      // Initial setup
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
        vendorId: vendor._id,
        adminId, // Track the admin who set up the details
      };

      const newBankDetails = new BankDetails(bankDetailsData);
      await newBankDetails.save();

      // Link the new bank details to the vendor
      vendor.bankDetails = newBankDetails._id;
      await vendor.save();

      return res.status(201).json({
        message: "Bank details added successfully by admin",
        bankDetails: newBankDetails,
      });
    } else {
      const bankDetailsData = {
        accountNumber: accountNumber || existingBankDetails.accountNumber,
        bankName: bankName || existingBankDetails.bankName,
        ifscCode: ifscCode || existingBankDetails.ifscCode,
        accountType: accountType || existingBankDetails.accountType,
        adminId, // Update with the admin's ID
      };

      const updatedBankDetails = await BankDetails.findByIdAndUpdate(
        vendor.bankDetails,
        { $set: bankDetailsData },
        { new: true }
      );

      return res.status(200).json({
        message: "Bank details updated successfully by admin",
        bankDetails: updatedBankDetails,
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const uploadVendorBusinessDetailsByAdmin = async (req, res) => {
  const { vendorID } = req.params;
  const {
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
  const adminId = req.user._id;

  try {
    // Check if the vendor exists
    const vendor = await Vender.findById(vendorID);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Find existing business details for the vendor
    let businessDetails = await BusinessDetails.findOne({ vendorID });

    if (businessDetails) {
      // Update existing business details
      businessDetails.typeOfBusiness =
        typeOfBusiness || businessDetails.typeOfBusiness;
      businessDetails.nameOfApplicant =
        nameOfApplicant || businessDetails.nameOfApplicant;
      businessDetails.udyamAadhaar =
        udyamAadhaar || businessDetails.udyamAadhaar;
      businessDetails.categoriesOfServices =
        categoriesOfServices || businessDetails.categoriesOfServices;
      businessDetails.businessAddress =
        businessAddress || businessDetails.businessAddress;
      businessDetails.state = state || businessDetails.state;
      businessDetails.panNumber = panNumber || businessDetails.panNumber;
      businessDetails.gstNumber = gstNumber || businessDetails.gstNumber;
      businessDetails.city = city || businessDetails.city;
      businessDetails.pincode = pincode || businessDetails.pincode;
      businessDetails.serviceableRadius =
        serviceableRadius || businessDetails.serviceableRadius;
      businessDetails.adminId = adminId;

      await businessDetails.save();

      return res.status(200).json({
        message: "Business details updated successfully by admin",
        document: businessDetails,
      });
    } else {
      // Validate required fields for new business details
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

      // Create new business details
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
        adminId: adminId,
      });

      const savedBusiness = await newBusinessDetails.save();

      // Link the new business details to the vendor
      vendor.businessDetails = savedBusiness._id;
      await vendor.save();

      return res.status(201).json({
        message: "Business details added successfully by admin",
        document: savedBusiness,
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Server error", details: error.message });
  }
};

const updateVendorProfileByAdmin = async (req, res) => {
  const { vendorID } = req.params;
  const adminId = req.user._id;

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
    const user = await Vender.findById(vendorID);
    if (!user) {
      return res.status(404).json({ error: "Vendor not found" });
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
          .json({ error: "Alternate phone number already in use" });
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
    if (adminId) user.adminId = adminId;

    await user.save();

    res
      .status(200)
      .json({ message: "Vendor profile updated successfully by admin" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};
const updateVendorBioByAdmin = async (req, res) => {
  const { vendorID } = req.params;
  const { bio } = req.body;
  const adminId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(vendorID)) {
      return res.status(400).json({ error: "Invalid vendor ID" });
    }

    const vendor = await Vender.findById(vendorID);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    vendor.bio = bio || vendor.bio;
    vendor.updatedByAdminId = adminId; // Store admin ID
    await vendor.save();

    res.status(200).json({
      message: "Vendor bio updated successfully by admin",
      updatedBy: adminId,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const updateVendorProfilePictureByAdmin = async (req, res) => {
  const { vendorID } = req.params;
  const profilePic = req.file ? path.basename(req.file.path) : "";
  const adminId = req.user._id; // Extract adminId from the authenticated user

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
    vendor.updatedByAdminId = adminId; // Store admin ID
    await vendor.save();

    res.status(200).json({
      message: "Profile picture updated successfully by admin",
      profilePicture: vendor.profilePicture,
      updatedBy: adminId,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const getVendorByNameOrVendorUserName = async (req, res) => {
  const { searchTerm } = req.body;

  try {
    const vendors = await Vender.aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { userName: { $regex: searchTerm, $options: "i" } },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          userName: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    if (!vendors || vendors.length === 0) {
      return res.status(200).json({ message: "No vendors found" });
    }

    res.status(200).json({ vendors });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const getVendorPackageList = async (req, res) => {
  const { vendorId, categoryId } = req.params;

  try {
    const query = { vendorId: vendorId };
    if (categoryId !== "all") {
      query.Category = categoryId;
    }

    const vendorPackages = await vendorServiceListingFormModal.find(query);

    const services = vendorPackages.flatMap((packageItem) => {
      return packageItem.services.map((service) => {
        const values = service.values || new Map();

        // Extracting values from the Map
        const title =
          values.get("Title") ||
          values.get("VenueName") ||
          values.get("FoodTruckName") ||
          null;

        return {
          _id: service._id, // Include the service's _id
          title,
        };
      });
    });

    res.status(200).json({ services });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const getAllVendorsPackage = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const searchTerm = req.query.search || "";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

  try {
    const matchStage = searchTerm
      ? {
          $match: {
            $or: [
              {
                "services.values.Title": { $regex: searchTerm, $options: "i" },
              },
              {
                "services.values.VenueName": {
                  $regex: searchTerm,
                  $options: "i",
                },
              },
              {
                "services.values.FoodTruckName": {
                  $regex: searchTerm,
                  $options: "i",
                },
              },
            ],
          },
        }
      : null;

    const pipeline = [];

    if (matchStage) {
      pipeline.push(matchStage);
    }

    pipeline.push(
      { $unwind: "$services" },

      {
        $lookup: {
          from: "categories",
          localField: "Category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          categoryName: "$categoryDetails.name",
        },
      },
      {
        $lookup: {
          from: "venders",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendorDetails",
        },
      },
      {
        $unwind: {
          path: "$vendorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          vendorName: "$vendorDetails.userName",
        },
      },
      {
        $project: {
          "services.values.Title": 1,
          "services.values.VenueName": 1,
          "services.values.FoodTruckName": 1,
          "services._id": 1,
          "services.sku": 1,
          "services.status": 1,
          "services.packageStatus": 1,
          categoryName: 1,
          vendorName: 1,
          _id: 1,
        },
      },
      {
        $sort: {
          "serviceDetails.values.Title": sortOrder,
          "serviceDetails.values.FoodTruckName": sortOrder,
          "serviceDetails.values.VenueName": sortOrder,
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "total" }],
        },
      }
    );

    const AllPacakage = await vendorServiceListingFormModal.aggregate(pipeline);
    const allPackages = AllPacakage[0].data;
    const totalPackages = AllPacakage[0].totalCount[0]?.total || 0;

    return res.status(200).json({
      message: "Packages Fetched Successfully",
      data: allPackages,
      total: totalPackages,
      currentPage: page,
      totalPages: Math.ceil(totalPackages / limit),
    });
  } catch (error) {
    console.error(error);

    res
      .status(500)
      .json({ message: "Failed to create submission", error: error.message });
  }
};
const archiveVendorServicehandle = async (req, res) => {
  const { serviceId, PackageId } = req.params;

  // Validate if both serviceId and PackageId are present
  if (!serviceId || !PackageId) {
    return res
      .status(400)
      .json({ message: "Both serviceId and PackageId are required" });
  }

  try {
    const vendorService = await vendorServiceListingFormModal.findById(
      serviceId
    );

    if (!vendorService) {
      return res.status(404).json({ message: "Service not found" });
    }

    const serviceIndex = vendorService.services.findIndex(
      (pkg) => pkg._id.toString() === PackageId
    );

    if (serviceIndex === -1) {
      return res.status(404).json({ message: "Package not found" });
    }

    vendorService.services[serviceIndex].isDeleted = true;

    await vendorService.save();

    res
      .status(200)
      .json({ message: "Service archived successfully", vendorService });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred", error });
  }
};
const deleteFromS3 = async (filePaths) => {
  const objects = filePaths.map((filePath) => ({ Key: filePath }));

  if (objects.length === 0) {
    console.log("No files to delete from S3.");
    return;
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Delete: {
      Objects: objects,
      Quiet: false,
    },
  };

  try {
    const command = new DeleteObjectsCommand(params); // Create the command
    const data = await s3.send(command); // Send the command to S3

    if (data.Deleted && data.Deleted.length > 0) {
      console.log("Successfully deleted files from S3:");
      data.Deleted.forEach((deleted) => console.log(`- ${deleted.Key}`));
    }

    if (data.Errors && data.Errors.length > 0) {
      console.error("Errors encountered during S3 deletion:");
      data.Errors.forEach((error) =>
        console.error(`- File: ${error.Key}, Error: ${error.Message}`)
      );
    }

    return data; // Return the response for further logging if needed
  } catch (error) {
    console.error("Error deleting files from S3:", error);
    throw error;
  }
};

const deleteVendorService = async (req, res) => {
  const { serviceId, PackageId } = req.params;

  if (!serviceId || !PackageId) {
    return res
      .status(400)
      .json({ message: "Both serviceId and PackageId are required" });
  }

  try {
    const vendorService = await vendorServiceListingFormModal.findById(
      serviceId
    );

    if (!vendorService) {
      return res.status(404).json({ message: "Service not found" });
    }

    const serviceIndex = vendorService.services.findIndex(
      (pkg) => pkg._id.toString() === PackageId
    );

    if (serviceIndex === -1) {
      return res.status(404).json({ message: "Package not found" });
    }

    const serviceValues = vendorService.services[serviceIndex].values;

    const filePaths = [
      ...(serviceValues.get("Portfolio")?.photos || []),
      ...(serviceValues.get("Portfolio")?.videos || []),
      ...(serviceValues.get("CoverImage") || []),
    ];

    console.log("File paths extracted from serviceValues:", filePaths);

    const deleteResponse = await deleteFromS3(filePaths);
    console.log("S3 Delete Response:", deleteResponse);

    // Remove the service
    vendorService.services.splice(serviceIndex, 1);

    // If no services remain, delete the entire document
    if (vendorService.services.length === 0) {
      await vendorServiceListingFormModal.findByIdAndDelete(serviceId);
      return res
        .status(200)
        .json({ message: "Service deleted along with the document" });
    }

    // Otherwise, save the updated document
    await vendorService.save();

    res.status(200).json({
      message: "Service deleted successfully",
      s3Response: deleteResponse,
    });
  } catch (error) {
    console.error("Error in deleteVendorService:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the service", error });
  }
};
const getAllVendorWithNumberOfService = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const searchTerm = req.query.search || "";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

  try {
    const vendors = await Vender.aggregate([
      {
        $lookup: {
          from: "vendorservicelisitingforms",
          localField: "_id",
          foreignField: "vendorId",
          as: "vendorServices",
        },
      },
      {
        $addFields: {
          numberOfServices: {
            $sum: {
              $map: {
                input: "$vendorServices",
                as: "service",
                in: { $size: "$$service.services" },
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "items.vendorId",
          as: "vendorOrders",
        },
      },
      {
        $addFields: {
          totalBookings: { $size: "$vendorOrders" }, // Count the total bookings for each vendor
        },
      },
      {
        $match: {
          name: { $regex: searchTerm, $options: "i" },
        },
      },
      {
        $sort: { numberOfServices: sortOrder },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          name: 1,
          userName: 1,
          numberOfServices: 1,
          totalBookings: 1, // Include the totalBookings field
        },
      },
    ]);

    const totalVendors = await Vender.countDocuments({
      name: { $regex: searchTerm, $options: "i" },
    });

    res.status(200).json({
      vendors,
      totalVendors,
      totalPages: Math.ceil(totalVendors / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching vendors with services:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const getAllUsersWithOrderDetails = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const searchTerm = req.query.search || "";

  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "userId",
          as: "userOrders",
        },
      },
      {
        $addFields: {
          totalOrders: {
            $sum: {
              $map: {
                input: "$userOrders",
                as: "order",
                in: { $size: "$$order.items" },
              },
            },
          },
          totalAmount: { $sum: "$userOrders.totalAmount" },
        },
      },
      {
        $match: {
          name: { $regex: searchTerm, $options: "i" },
        },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          name: 1,
          email: 1,
          phoneNumber: 1,
          totalOrders: 1,
          totalAmount: 1,
        },
      },
    ]);

    const totalUsers = await User.countDocuments({
      name: { $regex: searchTerm, $options: "i" },
    });

    res.status(200).json({
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching users with order details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const getAdminDashboardDataHandle = async (req, res) => {
  try {
    const totalVendor = await Vender.find();

    const orderStatusDetails = await OrderModel.aggregate([
      // Add a field to calculate per-item platform fees
      {
        $addFields: {
          platformFeePerItem: {
            $cond: {
              if: { $gt: [{ $size: "$items" }, 0] }, // Check if items exist
              then: { $divide: ["$platformFee", { $size: "$items" }] },
              else: 0
            }
          },
          platformGstPerItem: {
            $cond: {
              if: { $gt: [{ $size: "$items" }, 0] },
              then: { $divide: ["$platformGstAmount", { $size: "$items" }] },
              else: 0
            }
          }
        }
      },
      // Unwind the items array to process each item separately
      { $unwind: "$items" },
      // Add platform fees and GST to the item's total
      {
        $addFields: {
          itemTotal: {
            $add: [
              "$items.totalPrice",
              "$items.gstAmount",
              "$platformFeePerItem",
              "$platformGstPerItem"
            ]
          }
        }
      },
      // Group by orderStatus and calculate totals
      {
        $group: {
          _id: "$items.orderStatus",
          count: { $sum: 1 },
          totalCombined: { $sum: "$itemTotal" }
        }
      }
    ]);

    // Format the result into a readable structure
    const orderStatusSummary = orderStatusDetails.map((status) => ({
      orderStatus: status._id,
      count: status.count,
      totalCombined: status.totalCombined
    }));

    res.status(200).json({
      totalVendor: totalVendor.length,
      orderStatusSummary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};




export {
  getAllVendorWithThereProfileStatusAndService,
  vendorVerifyDocument,
  updateVendorBankDetailsByAdmin,
  uploadVendorBusinessDetailsByAdmin,
  updateVendorProfileByAdmin,
  updateVendorBioByAdmin,
  updateVendorProfilePictureByAdmin,
  getVendorByNameOrVendorUserName,
  getVendorPackageList,
  getAllVendorsPackage,
  archiveVendorServicehandle,
  deleteVendorService,
  getAllVendorWithNumberOfService,
  getAllUsersWithOrderDetails,getAdminDashboardDataHandle
};
