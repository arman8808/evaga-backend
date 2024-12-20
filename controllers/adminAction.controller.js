import Vender from "../modals/vendor.modal.js";
import venderDocument from "../modals/document.modal.js";
import { calculateProfileCompletion } from "../utils/calculateVendorProfilePercentage.js";

const getAllVendorWithThereProfileStatusAndService = async (req, res) => {
  try {
    const vendorsWithServiceData = await Vender.aggregate([
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
    ]);

    const enrichedVendors = vendorsWithServiceData.map((vendor) => {
      const profileCompletion = calculateProfileCompletion(vendor);
      return { ...vendor, profileCompletion };
    });
    if (enrichedVendors.length === 0 || !enrichedVendors) {
      return res.status(404).json({ error: "No vendors found" });
    }
    res.json({ message: "Sucessfully Fetched Data", data: enrichedVendors });
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

export { getAllVendorWithThereProfileStatusAndService, vendorVerifyDocument };
