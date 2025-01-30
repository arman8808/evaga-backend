import { Category } from "../modals/categoryModel.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
import Wishlist from "../modals/wishlist.model.js";
const toggleWishlist = async (req, res) => {
  const { userId } = req.params;
  const { serviceId, packageId } = req.body;

  if (!userId || !serviceId || !packageId) {
    return res
      .status(400)
      .json({ error: "Please provide userId, serviceId, and packageId." });
  }

  try {
    // Check if the service exists
    const service = await vendorServiceListingFormModal.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    // Check if the package exists in the service
    const packageExists = service.services.some(
      (pkg) => pkg._id.toString() === packageId
    );

    if (!packageExists) {
      return res
        .status(400)
        .json({ message: "Package not found in the service." });
    }

    // Check if the item already exists in the wishlist
    const existingItem = await Wishlist.findOne({
      userId,
      serviceId,
      packageId,
    });

    if (existingItem) {
      // If it exists, remove it
      await Wishlist.findByIdAndDelete(existingItem._id);
      return res.status(200).json({ message: "Item removed from wishlist." });
    } else {
      // If it does not exist, add it
      const wishlistItem = new Wishlist({ userId, serviceId, packageId });
      await wishlistItem.save();
      return res
        .status(201)
        .json({ message: "Item added to wishlist.", wishlistItem });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to toggle wishlist." });
  }
};

const getWishlist = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "Please provide userId." });
  }

  try {
    const wishlist = await Wishlist.find({ userId }).populate({
      path: "serviceId",
      select: "Category services", 
    });

    if (!wishlist.length) {
      return res
        .status(200)
        .json({ message: "No items found in the wishlist." });
    }

    // Map and format the wishlist response
    const formattedWishlist = await Promise.all(
      wishlist.map(async (item) => {
        const service = item.serviceId;

        const packageDetails = service.services.find((pkg) =>
          pkg._id.equals(item.packageId)
        );

        // Fetch category name
        const category = await Category.findById(service?.Category).select(
          "name -_id"
        );

        return {
          _id: service._id,
          Category: service.Category,
          categoryName: category?.name || "Unknown", // Add category name
          packageDetails: packageDetails,
        };
      })
    );

    res.status(200).json({ wishlist: formattedWishlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch wishlist." });
  }
};

export { toggleWishlist, getWishlist };
