import { Category } from "../modals/categoryModel.js";
import RecentlyViewed from "../modals/RecentlyViewed.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

export const addToRecentlyViewed = async (req, res) => {
    const { userId, packageId, serviceId } = req.body;
    console.log(userId, packageId, serviceId);
  
    try {
      const maxItems = 10;
  
      // Step 1: Remove existing entry (if it exists)
      await RecentlyViewed.findOneAndUpdate(
        { userId },
        { $pull: { items: { packageId, serviceId } } }, // Remove old item
        { new: true }
      );
  
      // Step 2: Add the new item at the beginning & limit items count
      const updatedRecentlyViewed = await RecentlyViewed.findOneAndUpdate(
        { userId },
        {
          $push: { items: { $each: [{ packageId, serviceId }], $position: 0 } }, // Insert at start
          $slice: { items: maxItems }, // Keep only latest `maxItems`
        },
        { new: true, upsert: true } // Create if not exists, return updated
      );
  
      res.status(200).json({
        message: "Recently viewed list updated successfully",
        recentlyViewed: updatedRecentlyViewed.items,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
    

export const getRecentlyViewed = async (req, res) => {
  const { userId } = req.params;

  try {
    const recentlyViewed = await RecentlyViewed.findOne({ userId });

    if (!recentlyViewed) {
      return res
        .status(200)
        .json({ message: "No recently viewed items found" });
    }

    const serviceIds = recentlyViewed.items.map(
      (item) => new ObjectId(item.serviceId)
    );
    const packageIds = recentlyViewed.items.map(
      (item) => new ObjectId(item.packageId)
    );
  

    const serviceDetails = await vendorServiceListingFormModal.find({
      _id: { $in: serviceIds },
    });
    const category = await Category.findById(serviceDetails.Category).select(
        "name"
      );
      const response = await Promise.all(
        serviceDetails.flatMap(async (serviceDetail) => {
          const category = await Category.findById(serviceDetail.Category).select("name");
          return serviceDetail.services
            .filter((service) => packageIds.some((pkgId) => pkgId.equals(service._id)))
            .map((service) => {
              const values =
                service.values instanceof Map ? Object.fromEntries(service.values) : service.values;
  
              const result = {
                serviceId: serviceDetail._id,
                packageId: service._id,
                Title: values?.Title,
                FoodTruckName: values?.FoodTruckName,
                VenueName: values?.VenueName,
                price: values?.Price,
                Pricing: values?.Pricing,
                Price: values?.Price,
                CoverImage: values?.CoverImage,
                ProductImage: values?.ProductImage?.[0],
                Package: values?.Package,
                "OrderQuantity&Pricing": values?.["OrderQuantity&Pricing"],
                "Duration&Pricing": values?.["Duration&Pricing"],
                SessionLength: values?.SessionLength,
                "SessionLength&Pricing": values?.["SessionLength&Pricing"],
                QtyPricing: values?.QtyPricing,
                CategoryName: category?.name || "Unknown", 
              };
  
              return Object.fromEntries(
                Object.entries(result).filter(
                  ([_, value]) => value !== undefined && value !== "" && value !== null
                )
              );
            });
        })
      );
  
      res.status(200).json({ recentlyViewed: response.flat() });
  
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
