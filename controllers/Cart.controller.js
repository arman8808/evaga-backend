import Cart from "../modals/Cart.modal";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal";
const addToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { serviceId, packageId, selectedSessions, addons } = req.body.item;

    const service = await vendorServiceListingFormModal.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    const selectedPackage = service?.service?.find(
      (item) => item?._id === packageId
    );
    const basePrice = 0;

    const sessions = selectedSessions.map((session) => ({
      ...session,
      sessionTotalPrice: session.sessionPrice * session.quantity,
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
        serviceName: service.name,
        basePrice,
        selectedSessions: sessions,
        addons,
        totalPrice,
      };
    } else {
      cart.items.push({
        serviceId,
        serviceName: service.name,
        basePrice,
        selectedSessions: sessions,
        addons,
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
      return res.status(404).json({ error: "Cart not found" });
    }
    res.status(200).json(cart);
  } catch (error) {
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

    // Recalculate totals
    const sessions = selectedSessions.map((session) => ({
      ...session,
      sessionTotalPrice: session.sessionPrice * session.quantity,
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
