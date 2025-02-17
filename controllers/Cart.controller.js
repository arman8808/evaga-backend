import Cart from "../modals/Cart.modal.js";
import Coupon from "../modals/coupons.modal.js";
import GstCategory from "../modals/gstCategory.modal.js";
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
    const { couponCode } = req.query; 
    let discount = 0;

    // Fetch the cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({ message: "Cart not found" });
    }

    const totalOfCart = cart.items.reduce(
      (total, item) => total + item.totalPrice,
      0
    );

    const platformFee = Math.min((totalOfCart * 2) / 100, 1000);


    const gstPercentage = 12;
    const platformGstAmount = (platformFee * gstPercentage) / 100;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });

      if (!coupon) {
        return res.status(404).json({ message: "Invalid coupon code." });
      }

      const now = new Date();
      if (now < coupon.startDate || now > coupon.endDate) {
        return res
          .status(400)
          .json({ message: "Coupon is not valid at this time." });
      }

      const userUsage = coupon.usersUsed.get(userId);
      if (userUsage && userUsage.usageCount >= coupon.usageLimit) {
        return res
          .status(400)
          .json({ message: "Usage limit reached for this coupon." });
      }

      if (coupon.discountAmount) {
        discount = coupon.discountAmount;
      } else if (coupon.discountPercentage) {
        discount = (coupon.discountPercentage / 100) * totalOfCart;
        if (coupon.cap !== null) {
          discount = Math.min(discount, coupon.cap);
        }
      }

      discount = Math.min(discount, totalOfCart);


      coupon.usersUsed.set(userId, {
        userId,
        usageCount: (userUsage?.usageCount || 0) + 1,
      });
      await coupon.save();
    }

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
            const values = Object.fromEntries(matchingPackage.values);

            const {
              CoverImage,
              Title,
              ProductImage,
              VenueName,
              FoodTruckName,
            } = values;

            const gstCategory = await GstCategory.findOne({
              categoryId: service.Category,
            });

            let gstPercentage = 18; 
            if (gstCategory && gstCategory.gstRates.length > 0) {
              const activeGst = gstCategory.gstRates[gstCategory.gstRates.length - 1];
              gstPercentage = activeGst.gstPercentage || 12;
            }

            const gstAmount = (item.totalPrice * gstPercentage) / 100;

            return {
              ...item._doc,
              packageDetails: {
                CoverImage,
                Title,
                ProductImage,
                VenueName,
                FoodTruckName,
              },
              gstAmount,
            };
          }
        }

        return {
          ...item._doc,
          packageDetails: null,
          gstAmount: 0,
        };
      })
    );

    const totalGst = updatedItems.reduce(
      (total, item) => total + item.gstAmount,
      0
    );

    const totalBeforeDiscount = totalOfCart + platformFee + platformGstAmount + totalGst;
    const totalAfterDiscount = Math.max(totalBeforeDiscount - discount, 0); 

    const updatedCart = {
      ...cart.toObject(),
      items: updatedItems,
      totalOfCart, 
      platformFee, 
      platformGstAmount, 
      totalGst, 
      discount, 
      totalBeforeDiscount,
      totalAfterDiscount, 
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
