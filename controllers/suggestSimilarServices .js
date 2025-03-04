import mongoose from "mongoose";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";


const suggestSimilarServices = async (req, res) => {
  try {
    // Extract and parse the stringified items from the request body
    let { items } = req.body;

    if (!items) {
      return res.status(400).json({ message: "No items provided in the request body" });
    }

    // Parse items if they are stringified
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (error) {
        return res.status(400).json({ message: "Invalid items format. Unable to parse JSON." });
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty or not in the correct format" });
    }

    const suggestions = [];

    for (const item of items) {
      const { serviceId } = item;

      // Step 1: Find the document with the given serviceId
      const serviceDocument = await vendorServiceListingFormModal.findOne({
        "_id": new mongoose.Types.ObjectId(serviceId), // Use 'new' here
      });

      if (!serviceDocument) {
        console.warn(`Service with ID ${serviceId} not found`);
        continue; // Skip to the next item if the service is not found
      }

      // Step 2: Retrieve the category of the service
      const { Category } = serviceDocument;

      if (!Category) {
        console.warn(`Category not found for service ID ${serviceId}`);
        continue; // Skip to the next item if category is missing
      }

      // Step 3: Find all services in the same category
      const similarServices = await vendorServiceListingFormModal.find({
        Category: new mongoose.Types.ObjectId(Category), // Use 'new' here
      });

      // Step 4: Extract and structure each service separately
      const similarServiceItems = similarServices.flatMap((doc) =>
        doc.services.map((service) => ({
          vendorId: doc.vendorId,
          serviceId: service._id,
          title: service.values?.Title || "No Title",
          category: doc.Category,
          subCategory: doc.SubCategory,
          portfolio: service.values?.Portfolio || {},
          locationType: service.values?.LocationType || "Not Specified",
          teamSize: service.values?.TeamSize || "N/A",
          audienceInteraction: service.values?.AudienceInteraction || "N/A",
        }))
      );

      // Add the results for this serviceId to the main suggestions array
      suggestions.push({
        serviceId,
        similarServices: similarServiceItems,
      });
    }

    // Step 5: Respond with the suggestions
    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred", error: error.message });
  }
};
export { suggestSimilarServices };
