import mongoose from "mongoose";
const { Types } = mongoose;
const ObjectId = Types.ObjectId;

const isValidObjectId = (id) => ObjectId.isValid(id);

import { Category } from "../modals/categoryModel.js";
import Vender from "../modals/vendor.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
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
    // if (!allPackages.length) {
    //   return res.status(404).json({ error: "No Packages Found" });
    // }

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
