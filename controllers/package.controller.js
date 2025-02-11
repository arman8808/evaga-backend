import mongoose from "mongoose";
const { Types } = mongoose;
const ObjectId = Types.ObjectId;

const isValidObjectId = (id) => ObjectId.isValid(id);

import { Category } from "../modals/categoryModel.js";
import Vender from "../modals/vendor.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
import { getPreSignedUrl } from "../utils/getPreSignedUrl.js";
const getAllPackage = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const searchTerm = req.query.search || "";
  const categoryId = req.query.category || "all";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const eventTypes = req.query.eventTypes || [];
  const locationTypes = req.query.locationTypes || [];
  const priceRange = req.query.priceRange || [];
  if (categoryId !== "all" && !isValidObjectId(categoryId)) {
    return res.status(400).json({ error: "Invalid Category ID" });
  }

  try {
    const AllPacakage = await vendorServiceListingFormModal.aggregate([
      {
        $match: {
          ...(categoryId !== "all"
            ? { Category: new ObjectId(categoryId) }
            : {}),
        },
      },

      {
        $unwind: {
          path: "$Category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          let: { categoryId: "$Category" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$categoryId"] } } },
            { $project: { name: 1 } },
          ],
          as: "categoryData",
        },
      },

      {
        $unwind: {
          path: "$SubCategory",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "subcategories",
          let: { subCategoryId: "$SubCategory" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$subCategoryId"] } } },
            { $project: { name: 1 } },
          ],
          as: "SubCategoryData",
        },
      },
      {
        $unwind: "$services",
      },
      {
        $addFields: {
          serviceDetails: "$services",
          categoryName: "$categoryData.name",
          SubcategoryName: "$SubCategoryData.name",
        },
      },

      {
        $match: {
          $or: [
            { AbouttheService: { $regex: searchTerm, $options: "i" } },
            { categoryName: { $regex: searchTerm, $options: "i" } },
            { SubcategoryName: { $regex: searchTerm, $options: "i" } },
            { "addon.name": { $regex: searchTerm, $options: "i" } },
            {
              "serviceDetails.values.Title": {
                $regex: searchTerm,
                $options: "i",
              },
            },
            {
              "serviceDetails.values.VenueName": {
                $regex: searchTerm,
                $options: "i",
              },
            },
            {
              "serviceDetails.values.FoodTruckName": {
                $regex: searchTerm,
                $options: "i",
              },
            },
            {
              "serviceDetails.values.Event Type": {
                $regex: searchTerm,
                $options: "i",
              },
            },
            {
              "serviceDetails.values.Inclusions": {
                $regex: searchTerm,
                $options: "i",
              },
            },
            {
              "serviceDetails.menu.someField": {
                $regex: searchTerm,
                $options: "i",
              },
            },
            {
              "serviceDetails.cateringPackageVenue.someField": {
                $regex: searchTerm,
                $options: "i",
              },
            },
            {
              "serviceDetails.cateringValueInVenue.someField": {
                $regex: searchTerm,
                $options: "i",
              },
            },
          ],
        },
      },
      {
        $match: {
          ...(eventTypes.length > 0 && {
            $or: [
              { "serviceDetails.values.Event Type": { $in: eventTypes } },
              { "serviceDetails.values.EventType": { $in: eventTypes } },
            ],
          }),
          ...(locationTypes.length > 0 && {
            "serviceDetails.values.LocationType": { $in: locationTypes },
          }),

          // ...(priceRange.length === 2 && {
          //   $or: [
          //     {
          //       $expr: {
          //         $and: [
          //           {
          //             $gte: [
          //               {
          //                 $toDouble: {
          //                   $cond: [
          //                     { $eq: [{ $type: "$serviceDetails.values.Price" }, "array"] },
          //                     null,
          //                     "$serviceDetails.values.Price"
          //                   ]
          //                 }
          //               },
          //               priceRange[0]
          //             ]
          //           },
          //           {
          //             $lte: [
          //               {
          //                 $toDouble: {
          //                   $cond: [
          //                     { $eq: [{ $type: "$serviceDetails.values.Price" }, "array"] },
          //                     null,
          //                     "$serviceDetails.values.Price"
          //                   ]
          //                 }
          //               },
          //               priceRange[1]
          //             ]
          //           }
          //         ]
          //       }
          //     },
          //     {
          //       $expr: {
          //         $and: [
          //           {
          //             $gte: [
          //               {
          //                 $toDouble: {
          //                   $cond: [
          //                     { $eq: [{ $type: "$serviceDetails.values.price" }, "array"] },
          //                     null,
          //                     "$serviceDetails.values.price"
          //                   ]
          //                 }
          //               },
          //               priceRange[0]
          //             ]
          //           },
          //           {
          //             $lte: [
          //               {
          //                 $toDouble: {
          //                   $cond: [
          //                     { $eq: [{ $type: "$serviceDetails.values.price" }, "array"] },
          //                     null,
          //                     "$serviceDetails.values.price"
          //                   ]
          //                 }
          //               },
          //               priceRange[1]
          //             ]
          //           }
          //         ]
          //       }
          //     },
          //     // Repeat similar logic for all other fields
          //   ],
          // }),
        },
      },
      {
        $project: {
          services: 0,
          categoryData: 0,
          SubCategoryData: 0,
          "serviceDetails.menuTemplateId": 0,
          "serviceDetails.cateringTemplateId": 0,
          "serviceDetails.cateringValueInVenue": 0,
          "serviceDetails.cateringPackageVenue": 0,
          "serviceDetails.menu": 0,
          "serviceDetails.values.AddOns": 0,
          "serviceDetails.values.TravelCharges": 0,
          "serviceDetails.values.Portfolio.photos": 0,
          "serviceDetails.values.Portfolio.videos": 0,
          "serviceDetails.values.Terms&Conditions": 0,
          YearofExperience: 0,
          AbouttheService: 0,
          updatedAt: 0,
          createdAt: 0,
        },
      },
      {
        $sort: {
          createdAt: -1,
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
      },
    ]);
    const allPackages = AllPacakage[0].data;
    const totalPackages = AllPacakage[0].totalCount[0]?.total || 0;

    const updatedPackages = await Promise.all(
      allPackages.map(async (pkg) => {
        if (pkg.serviceDetails && pkg.serviceDetails.values) {
          if (pkg.serviceDetails.values.CoverImage) {
            try {
              pkg.serviceDetails.values.CoverImage = await getPreSignedUrl(
                pkg.serviceDetails.values.CoverImage
              );
            } catch (error) {
              console.error(
                "Error generating presigned URL for imageUrl:",
                error
              );
            }
          }
        }
        return pkg;
      })
    );

    return res.status(200).json({
      message: "Packages Fetched Successfully",
      data: allPackages,
      total: totalPackages,
      currentPage: page,
      totalPages: Math.ceil(totalPackages / limit),
    });
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .json({ message: "Failed to create submission", error: error.message });
  }
};
const getOnepackage = async (req, res) => {
  const { serviceId, packageid } = req.params;
  if (!(serviceId || packageid)) {
    return res
      .status(404)
      .json({ error: "service Id and package Id is required" });
  }
  try {
    const verifiedService = await vendorServiceListingFormModal
      .findById(serviceId)
      .select("-updatedAt -createdAt -__v");

    if (!verifiedService) {
      return res.status(404).json({ error: "Vendor service not found" });
    }
    verifiedService.services = verifiedService.services.filter(
      (pkg) => pkg._id.toString() === packageid
    );
    const getVendorDetails = await Vender.findById(
      verifiedService?.vendorId
    ).select("name bio -_id");
    const category = await Category.findById(verifiedService?.Category).select(
      "name -_id"
    );
    const updatedPackages = await Promise.all(
      verifiedService?.services.map(async (pkg) => {
        if (pkg && pkg.values) {
          // Handle CoverImage
          if (pkg.values.get("CoverImage")) {
            try {
              const preSignedUrl = await getPreSignedUrl(
                pkg.values.get("CoverImage")
              );
              pkg.values.set("CoverImage", preSignedUrl);
            } catch (error) {
              console.error(
                "Error generating presigned URL for CoverImage:",
                error
              );
            }
          }

          // Handle Portfolio
          const portfolio = pkg.values.get("Portfolio");
          if (portfolio) {
            // Update photos
            if (Array.isArray(portfolio.photos)) {
              portfolio.photos = await Promise.all(
                portfolio.photos.map(async (photo) => {
                  try {
                    const preSignedUrl = await getPreSignedUrl(photo);
                    return preSignedUrl;
                  } catch (error) {
                    console.error(
                      "Error generating presigned URL for photo:",
                      error
                    );
                    return photo; // Return the original photo URL if an error occurs
                  }
                })
              );
            }

            // Update videos
            if (Array.isArray(portfolio.videos)) {
              portfolio.videos = await Promise.all(
                portfolio.videos.map(async (video) => {
                  try {
                    const preSignedUrl = await getPreSignedUrl(video);
                    return preSignedUrl;
                  } catch (error) {
                    console.error(
                      "Error generating presigned URL for video:",
                      error
                    );
                    return video; // Return the original video URL if an error occurs
                  }
                })
              );
            }

            // Update the Portfolio object in pkg.values
            pkg.values.set("Portfolio", portfolio);
          }
        }
        return pkg;
      })
    );

    // Update verifiedService.services
    if (verifiedService?.services) {
      verifiedService.services = updatedPackages;
    }



    res.status(200).json({
      message: "Vendor service Fetched successfully",
      data: verifiedService,
      getVendorDetails: getVendorDetails,
      category: category,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to verify vendor service",
      error: error.message,
    });
  }
};

export { getAllPackage, getOnepackage };
