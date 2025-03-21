import mongoose from "mongoose";
const { Types } = mongoose;
const ObjectId = Types.ObjectId;

const isValidObjectId = (id) => ObjectId.isValid(id);

import { Category } from "../modals/categoryModel.js";
import Vender from "../modals/vendor.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
import CategoryFee from "../modals/categoryFee.modal.js";
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
    const keywords = searchTerm
      .split(/\s+/)
      .filter((keyword) => keyword.length > 0);

    // Construct a dynamic query for multiple keywords
    const searchQuery =
      keywords.length > 0
        ? {
            $or: keywords.flatMap((keyword) => [
              { AbouttheService: { $regex: keyword, $options: "i" } },
              { categoryName: { $regex: keyword, $options: "i" } },
              { SubcategoryName: { $regex: keyword, $options: "i" } },
              { "addon.name": { $regex: keyword, $options: "i" } },
              {
                "serviceDetails.values.Title": {
                  $regex: keyword,
                  $options: "i",
                },
              },
              {
                "serviceDetails.values.VenueName": {
                  $regex: keyword,
                  $options: "i",
                },
              },
              {
                "serviceDetails.values.FoodTruckName": {
                  $regex: keyword,
                  $options: "i",
                },
              },
              {
                "serviceDetails.values.Event Type": {
                  $regex: keyword,
                  $options: "i",
                },
              },
              {
                "serviceDetails.values.EventType": {
                  $regex: keyword,
                  $options: "i",
                },
              },
              {
                "serviceDetails.values.Inclusions": {
                  $regex: keyword,
                  $options: "i",
                },
              },
              {
                "serviceDetails.values.Languages": {
                  $regex: keyword,
                  $options: "i",
                },
              },
              {
                "serviceDetails.values.Terms&Conditions": {
                  $regex: keyword,
                  $options: "i",
                },
              },
              {
                "serviceDetails.values.Description": {
                  $regex: keyword,
                  $options: "i",
                },
              },
              {
                "serviceDetails.menu.someField": {
                  $regex: keyword,
                  $options: "i",
                },
              },
              {
                "serviceDetails.cateringPackageVenue.someField": {
                  $regex: keyword,
                  $options: "i",
                },
              },
              {
                "serviceDetails.cateringValueInVenue.someField": {
                  $regex: keyword,
                  $options: "i",
                },
              },
            ]),
          }
        : {};

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
        $lookup: {
          from: "categoryfees",
          localField: "Category",
          foreignField: "categoryId",
          as: "categoryFee",
        },
      },
      {
        $addFields: {
          feesPercentage: {
            $ifNull: [{ $arrayElemAt: ["$categoryFee.feesPercentage", 0] }, 12],
          },
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
        $addFields: {
          "serviceDetails.values": {
            $mergeObjects: [
              "$serviceDetails.values",
              {
                "Duration&Pricing": {
                  $map: {
                    input: {
                      $ifNull: ["$serviceDetails.values.Duration&Pricing", []],
                    },
                    as: "item",
                    in: {
                      $mergeObjects: [
                        "$$item",
                        {
                          Amount: {
                            $multiply: [
                              { $toDouble: "$$item.Amount" },
                              {
                                $add: [
                                  1,
                                  { $divide: ["$feesPercentage", 100] },
                                ],
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
                SessionLength: {
                  $map: {
                    input: {
                      $ifNull: ["$serviceDetails.values.SessionLength", []],
                    },
                    as: "item",
                    in: {
                      $mergeObjects: [
                        "$$item",
                        {
                          Amount: {
                            $multiply: [
                              { $toDouble: "$$item.Amount" },
                              {
                                $add: [
                                  1,
                                  { $divide: ["$feesPercentage", 100] },
                                ],
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
                "SessionLength&Pricing": {
                  $map: {
                    input: {
                      $ifNull: [
                        "$serviceDetails.values.SessionLength&Pricing",
                        [],
                      ],
                    },
                    as: "item",
                    in: {
                      $mergeObjects: [
                        "$$item",
                        {
                          Amount: {
                            $multiply: [
                              { $toDouble: "$$item.Amount" },
                              {
                                $add: [
                                  1,
                                  { $divide: ["$feesPercentage", 100] },
                                ],
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
                QtyPricing: {
                  $map: {
                    input: {
                      $ifNull: ["$serviceDetails.values.QtyPricing", []],
                    },
                    as: "item",
                    in: {
                      $mergeObjects: [
                        "$$item",
                        {
                          Rates: {
                            $multiply: [
                              { $toDouble: "$$item.Rates" },
                              {
                                $add: [
                                  1,
                                  { $divide: ["$feesPercentage", 100] },
                                ],
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
                Price: {
                  $cond: {
                    if: { $gt: ["$serviceDetails.values.Price", null] },
                    then: {
                      $multiply: [
                        { $toDouble: "$serviceDetails.values.Price" },
                        { $add: [1, { $divide: ["$feesPercentage", 100] }] },
                      ],
                    },
                    else: "$serviceDetails.values.Price",
                  },
                },
                price: {
                  $cond: {
                    if: { $gt: ["$serviceDetails.values.price", null] },
                    then: {
                      $multiply: [
                        { $toDouble: "$serviceDetails.values.price" },
                        { $add: [1, { $divide: ["$feesPercentage", 100] }] },
                      ],
                    },
                    else: "$serviceDetails.values.price",
                  },
                },
                Pricing: {
                  $cond: {
                    if: { $gt: ["$serviceDetails.values.Pricing", null] },
                    then: {
                      $multiply: [
                        { $toDouble: "$serviceDetails.values.Pricing" },
                        { $add: [1, { $divide: ["$feesPercentage", 100] }] },
                      ],
                    },
                    else: "$serviceDetails.values.Pricing",
                  },
                },
                Package: {
                  $map: {
                    input: { $ifNull: ["$serviceDetails.values.Package", []] },
                    as: "item",
                    in: {
                      $mergeObjects: [
                        "$$item",
                        {
                          Rates: {
                            $multiply: [
                              { $toDouble: "$$item.Rates" },
                              {
                                $add: [
                                  1,
                                  { $divide: ["$feesPercentage", 100] },
                                ],
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
                "OrderQuantity&Pricing": {
                  $map: {
                    input: {
                      $ifNull: [
                        "$serviceDetails.values.OrderQuantity&Pricing",
                        [],
                      ],
                    },
                    as: "item",
                    in: {
                      $mergeObjects: [
                        "$$item",
                        {
                          Rates: {
                            $multiply: [
                              { $toDouble: "$$item.Rates" },
                              {
                                $add: [
                                  1,
                                  { $divide: ["$feesPercentage", 100] },
                                ],
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      },
      {
        $match: {
          "serviceDetails.status": true,
          ...searchQuery, 
        },
      },
      {
        $match: {
          ...(eventTypes.length > 0 && {
            $or: [
              {
                "serviceDetails.values.Event Type": {
                  $regex: new RegExp(eventTypes, "i"),
                },
              },
              {
                "serviceDetails.values.EventType": {
                  $regex: new RegExp(eventTypes, "i"),
                },
              },
            ],
          }),
          
          ...(locationTypes.length > 0 && {
            "serviceDetails.values.LocationType": {
              $regex: new RegExp(locationTypes, "i"),
            },
          }),
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

  if (!serviceId || !packageid) {
    return res
      .status(404)
      .json({ error: "Service ID and Package ID are required" });
  }

  try {
    const verifiedService = await vendorServiceListingFormModal
      .findById(serviceId)
      .select("-updatedAt -createdAt -__v");

    if (!verifiedService) {
      return res.status(404).json({ error: "Vendor service not found" });
    }

    // Find the specific package
    const packageDetails = verifiedService.services.find(
      (pkg) => pkg._id.toString() === packageid
    );

    if (!packageDetails) {
      return res.status(404).json({ error: "Package not found" });
    }

    if (!packageDetails.values || !(packageDetails.values instanceof Map)) {
      packageDetails.values = new Map(); // Ensure it's a Map object
    }

    // Fetch category fee from categoryfees modal
    let categoryFee = 12; // Default 12% increase
    const categoryFeeData = await CategoryFee.findOne({
      categoryId: verifiedService.Category,
    }).select("feesPercentage");

    if (categoryFeeData?.feesPercentage) {
      categoryFee = categoryFeeData.feesPercentage;
    }

    // Function to apply percentage increase
    const applyIncrease = (value, key) => {
      if (!value || isNaN(value)) {
        return value;
      }
      const updatedValue = (
        parseFloat(value) *
        (1 + categoryFee / 100)
      ).toFixed(2);
      return updatedValue;
    };

    // Function to update array-based values
    const updateArray = (key, fieldName) => {
      if (packageDetails.values.has(key)) {
        const updatedArray = packageDetails.values
          .get(key)
          ?.map((item, index) => ({
            ...item,
            [fieldName]: applyIncrease(
              item[fieldName],
              `${key}[${index}].${fieldName}`
            ),
          }));
        packageDetails.values.set(key, updatedArray);
      }
    };

    // Define the fields that need updates and their respective numeric keys
    const fieldsToUpdate = {
      Package: "Rates",
      "OrderQuantity&Pricing": "Rates",
      "Duration&Pricing": "Amount",
      SessionLength: "Amount",
      "SessionLength&Pricing": "Amount",
      QtyPricing: "Rates",
      AddOns: "Rates",
    };

    // Dynamically update only the fields that exist in packageDetails.values
    Object.keys(fieldsToUpdate).forEach((key) => {
      if (packageDetails.values.has(key)) {
        updateArray(key, fieldsToUpdate[key]);
      }
    });

    // Update individual price keys
    const priceKeys = ["Price", "price", "Pricing"];
    priceKeys.forEach((key) => {
      if (packageDetails.values.has(key)) {
        packageDetails.values.set(
          key,
          applyIncrease(packageDetails.values.get(key), key)
        );
      }
    });

    // Assign updated package back to service
    verifiedService.services = [packageDetails];

    // Fetch vendor and category details
    const getVendorDetails = await Vender.findById(
      verifiedService?.vendorId
    ).select("userName bio -_id");
    const category = await Category.findById(verifiedService?.Category).select(
      "name -_id"
    );

    res.status(200).json({
      message: "Package updated successfully",
      data: verifiedService,
      getVendorDetails: getVendorDetails,
      category: category,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch package details",
      error: error.message,
    });
  }
};

export { getAllPackage, getOnepackage };
