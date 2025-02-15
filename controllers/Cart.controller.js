import Cart from "../modals/Cart.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
const addToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    let { serviceId, packageId, selectedSessions, addons, defaultPrice } =
      req.body;

    selectedSessions = selectedSessions ? JSON.parse(selectedSessions) : [];
    const basePrice = defaultPrice ? Number(defaultPrice) : 0;
    const service = await vendorServiceListingFormModal.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    const selectedPackage = service?.services?.find((item) => {
      return item?._id == packageId;
    });
    let serviceName =
      selectedPackage.values?.Title ||
      selectedPackage.values?.FoodTruckName ||
      selectedPackage.values?.VenueName;

    const sessions = selectedSessions.map((session) => ({
      ...session,
      sessionTotalPrice: session.Amount * session.quantity,
      sessionName: session.type,
      quantity: session.quantity,
      sessionPrice: session.Amount,
    }));

    // const addonsTotalPrice = addons.reduce(
    //   (sum, addon) => sum + addon.addonPrice,
    //   0
    // );
    const sessionsTotalPrice = sessions.reduce(
      (sum, session) => sum + session.sessionTotalPrice,
      0
    );
    const totalPrice = basePrice + sessionsTotalPrice;
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.serviceId.toString() === serviceId
    );
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex] = {
        serviceId,
        packageId,
        basePrice,
        selectedSessions: sessions,
        addons,
        totalPrice,
      };
    } else {
      cart.items.push({
        serviceId,
        packageId,
        basePrice,
        selectedSessions: sessions,
        defaultPrice: defaultPrice ? Number(defaultPrice) : 0,
        totalPrice,
      });
    }

    await cart.save();
    res.status(200).json({ message: "Item Added To Cart" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({ message: "Cart not found" });
    }

    // Calculate the total price of the cart
    const totalOfCart = cart.items.reduce(
      (total, item) => total + item.totalPrice,
      0
    );

    // Calculate the platform fee
    const platformFee = Math.min((totalOfCart * 2) / 100, 1000);

    // Calculate the total cost (total of cart + platform fee)
    const totalWithFee = totalOfCart + platformFee;

    const updatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const service = await vendorServiceListingFormModal.findById(
          item.serviceId
        );

        if (service) {
          const matchingPackage = service.services.find(
            (pkg) => pkg._id.toString() === item.packageId
          );

          if (matchingPackage) {
            // Convert the Map to a plain object
            const values = Object.fromEntries(matchingPackage.values);

            const {
              CoverImage,
              Title,
              ProductImage,
              VenueName,
              FoodTruckName,
            } = values;

            return {
              ...item._doc,
              packageDetails: {
                CoverImage,
                Title,
                ProductImage,
                VenueName,
                FoodTruckName,
              },
            };
          }
        }

        return {
          ...item._doc,
          packageDetails: null,
        };
      })
    );

    const updatedCart = {
      ...cart.toObject(),
      items: updatedItems,
      totalOfCart, // Total of cart
      platformFee, // Platform fee (2% or max 1000)
      totalWithFee, // Total of cart + platform fee
    };

    res.status(200).json(updatedCart);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { userId } = req.params;
    const { serviceId, selectedSessions, addons } = req.body.item;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.serviceId.toString() === serviceId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    const basePrice = cart.items[itemIndex].basePrice;

    const sessions = selectedSessions.map((session) => ({
      ...session,
      sessionTotalPrice: session.Amount * session.quantity,
    }));

    const addonsTotalPrice = addons.reduce(
      (sum, addon) => sum + addon.addonPrice,
      0
    );
    const sessionsTotalPrice = sessions.reduce(
      (sum, session) => sum + session.sessionTotalPrice,
      0
    );
    const totalPrice = basePrice + sessionsTotalPrice + addonsTotalPrice;

    cart.items[itemIndex] = {
      serviceId,
      serviceName: cart.items[itemIndex].serviceName,
      basePrice,
      selectedSessions: sessions,
      addons,
      totalPrice,
    };

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { userId, serviceId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.serviceId.toString() !== serviceId
    );

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const { userId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { addToCart, getCart, updateCartItem, removeCartItem, clearCart };
