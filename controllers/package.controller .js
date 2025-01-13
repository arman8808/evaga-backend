import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
const getAllPackage = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  try {
    const AllPacakage = await vendorServiceListingFormModal.aggregate([
      {
        $unwind: {
          path: "$Category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "Category",
          foreignField: "_id",
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
          localField: "SubCategory",
          foreignField: "_id",
          as: "SubCategoryData",
        },
      },
      {
        $unwind: "$services",
      },
      {
        $addFields: {
          serviceDetails: "$services",
        },
      },
      {
        $addFields: {
          categoryName: "$categoryData.name",
        },
      },
      {
        $addFields: {
          SubcategoryName: "$SubCategoryData.name",
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
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "total" }],
        },
      },
    ]);
    const allPackages = AllPacakage[0].data;
    const totalPackages = AllPacakage[0].totalCount[0]?.total || 0;
    if (!allPackages.length) {
      return res.status(404).json({ error: "No Packages Found" });
    }

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
    const verifiedService = await vendorServiceListingFormModal.findById(
      serviceId
    );

    if (!verifiedService) {
      return res.status(404).json({ error: "Vendor service not found" });
    }
    verifiedService.services = verifiedService.services.filter(
      (pkg) => pkg._id.toString() === packageid
    );

    res.status(200).json({
      message: "Vendor service Fetched successfully",
      data: verifiedService,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to verify vendor service",
      error: error.message,
    });
  }
};

export { getAllPackage, getOnepackage };
