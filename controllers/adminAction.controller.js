import Vender from "../modals/vendor.modal.js";
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
        $unwind: { path: "$serviceListing", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          numberOfServices: {
            $size: "$serviceListing.services",
          },
        },
      },
      { $project: { serviceListing: 0 } },
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

export { getAllVendorWithThereProfileStatusAndService };
