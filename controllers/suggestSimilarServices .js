import mongoose from "mongoose";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
import CategoryFee from "../modals/categoryFee.modal.js";

const suggestSimilarServices = async (req, res) => {
  try {
    let { items } = req.body;

    if (!items) {
      return res
        .status(400)
        .json({ message: "No items provided in the request body" });
    }

    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (error) {
        return res
          .status(200)
          .json({ message: "Invalid items format. Unable to parse JSON." });
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(200)
        .json({ message: "Cart is empty or not in the correct format" });
    }

    const inputServiceIds = new Set(items.map((item) => item.packageId));
    const allSimilarServices = [];

    for (const item of items) {
      const { serviceId } = item;

      const serviceDocument = await vendorServiceListingFormModal.findOne({
        _id: new mongoose.Types.ObjectId(serviceId),
      });

      if (!serviceDocument) {
        console.warn(`Service with ID ${serviceId} not found`);
        continue;
      }

      const { Category } = serviceDocument;

      if (!Category) {
        console.warn(`Category not found for service ID ${serviceId}`);
        continue;
      }

      const similarServices = await vendorServiceListingFormModal.find({
        Category: new mongoose.Types.ObjectId(Category),
      });

      let categoryFee = 12; // Default 12% increase
      const categoryFeeData = await CategoryFee.findOne({
        categoryId: Category,
      }).select("feesPercentage");

      if (categoryFeeData?.feesPercentage) {
        categoryFee = categoryFeeData.feesPercentage;
      }

      const applyIncrease = (value) => {
        if (!value || isNaN(value)) return value;
        return (parseFloat(value) * (1 + categoryFee / 100)).toFixed(2);
      };

      const updateArray = (key, fieldName, values) => {
        if (values.has(key)) {
          const updatedArray = values.get(key)?.map((item, index) => ({
            ...item,
            [fieldName]: applyIncrease(item[fieldName]),
          }));
          values.set(key, updatedArray);
        }
      };

      const similarServiceItems = similarServices.flatMap((doc) =>
        doc.services
          .filter(
            (service) =>
              !inputServiceIds.has(service._id.toString()) &&
              service.packageStatus === "Verified"
          )
          .map((service) => {
            const Title =
              service.values?.Title instanceof Map
                ? service.values.get("Title")
                : service.values?.get("Title");
            const FoodTruckName =
              service.values?.Title instanceof Map
                ? service.values.get("FoodTruckName")
                : service.values?.get("FoodTruckName");
            const VenueName =
              service.values?.Title instanceof Map
                ? service.values.get("VenueName")
                : service.values?.get("VenueName");
            const CoverImage =
              service.values?.Title instanceof Map
                ? service.values.get("CoverImage")
                : service.values?.get("CoverImage");
            const ProductImage =
              service.values?.Title instanceof Map
                ? service.values.get("ProductImage")
                : service.values?.get("ProductImage");

            const fieldsToUpdate = {
              Package: "Rates",
              "OrderQuantity&Pricing": "Rates",
              "Duration&Pricing": "Amount",
              SessionLength: "Amount",
              "SessionLength&Pricing": "Amount",
              QtyPricing: "Rates",
              AddOns: "Rates",
            };

            Object.keys(fieldsToUpdate).forEach((key) => {
              if (service.values.has(key)) {
                updateArray(key, fieldsToUpdate[key], service.values);
              }
            });

            const priceKeys = ["Price", "price", "Pricing"];
            const updatedPrices = {};

            priceKeys.forEach((key) => {
              if (service.values.has(key)) {
                updatedPrices[key] = applyIncrease(service.values.get(key));
              }
            });

            return {
              vendorId: doc.vendorId,
              serviceId: doc._id, // Corrected here: Use doc._id instead of serviceId
              packageId: service._id,
              Title: Title,
              VenueName: VenueName,
              FoodTruckName: FoodTruckName,
              CoverImage: CoverImage,
              ProductImage: ProductImage,
              UpdatedPrices: updatedPrices,
              category: doc.Category,
              subCategory: doc.SubCategory,
            };
          })
      );

      allSimilarServices.push(...similarServiceItems);
    }

    return res.status(200).json({ suggestions: allSimilarServices });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};


export { suggestSimilarServices };
