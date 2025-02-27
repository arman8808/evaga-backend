import Cart from "../modals/Cart.modal.js";
import { Category } from "../modals/categoryModel.js";
import Coupon from "../modals/coupons.modal.js";
import GstCategory from "../modals/gstCategory.modal.js";
import Vender from "../modals/vendor.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
const addToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    let {
      serviceId,
      packageId,
      selectedSessions,
      addons,
      defaultPrice,
      vendorId,
      pincode,
      date,
      time,
    } = req.body;

    selectedSessions = selectedSessions ? JSON.parse(selectedSessions) : [];
    console.log(selectedSessions);

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
      sessionTotalPrice:
        (session.Amount || Number(session.rateInfo)) * session.quantity,
      sessionName: session.type,
      quantity: session.quantity,
      sessionPrice: session.Amount || Number(session.rateInfo),
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
        defaultPrice,
        selectedSessions: sessions,
        addons,
        totalPrice,
        vendorId,
        pincode,
        date,
        time,
      };
    } else {
      cart.items.push({
        serviceId,
        packageId,
        basePrice,
        selectedSessions: sessions,
        defaultPrice: defaultPrice ? Number(defaultPrice) : 0,
        totalPrice,
        vendorId,
        pincode,
        date,
        time,
      });
    }

    await cart.save();
    res.status(200).json({ message: "Item Added To Cart" });
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: error.message });
  }
};

const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { couponCode } = req.query;
    let discount = 0;
    let appliedCoupon = null;
    let categoryName = null;
    let vendorName = null;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({ message: "Cart not found" });
    }

    const totalOfCart = cart.items.reduce(
      (total, item) => total + item.totalPrice,
      0
    );
    const platformFee = Math.min((totalOfCart * 2) / 100, 1000);
    const gstPercentagePlatform = 18;
    const platformGstAmount = (platformFee * gstPercentagePlatform) / 100;

    // If a coupon code is sent in the request, validate and apply it
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });

      if (!coupon) {
        return res.status(404).json({ error: "Invalid coupon code." });
      }

      const now = new Date();
      if (now < coupon.startDate || now > coupon.endDate) {
        return res.status(400).json({ error: "Coupon Expired" });
      }

      const userUsage = coupon.usersUsed.get(userId);
      if (userUsage && userUsage.usageCount >= coupon.usageLimit) {
        return res
          .status(400)
          .json({ error: "Usage limit reached for this coupon." });
      }

      // Apply discount from the coupon
      if (coupon.discountAmount) {
        discount = coupon.discountAmount;
      } else if (coupon.discountPercentage) {
        discount = (coupon.discountPercentage / 100) * totalOfCart;
        if (coupon.cap !== null) {
          discount = Math.min(discount, coupon.cap);
        }
      }

      discount = Math.min(discount, totalOfCart);
      appliedCoupon = couponCode;

      // Save applied coupon to the cart
      cart.appliedCoupon = { code: couponCode, discount };
      await cart.save();

      // Update coupon usage
      coupon.usersUsed.set(userId, {
        userId,
        usageCount: (userUsage?.usageCount || 0) + 1,
      });
      await coupon.save();
    }
    
    else if (cart.appliedCoupon?.code) {
      discount = cart.appliedCoupon.discount;
      appliedCoupon = cart.appliedCoupon.code;
    }

    const updatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const service = await vendorServiceListingFormModal.findById(
          item.serviceId
        );

        let gstPercentage = 18;
        let gstAmount = 0;

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
            if (gstCategory && gstCategory.gstRates.length > 0) {
              const activeGst =
                gstCategory.gstRates[gstCategory.gstRates.length - 1];
              gstPercentage = activeGst.gstPercentage || 18;
            }

            gstAmount = (item.totalPrice * gstPercentage) / 100;
            const category = await Category.findById(service.Category);
            if (category) {
              categoryName = category.name;
            }
            const vendor = await Vender.findById(service.vendorId);
            if (vendor) {
              vendorName = vendor.userName;
            }

            return {
              ...item._doc,
              packageDetails: {
                CoverImage,
                Title,
                ProductImage,
                VenueName,
                FoodTruckName,
              },
              gstPercentage,
              gstAmount,
              categoryName,
              vendorName,
            };
          }
        }

        return {
          ...item._doc,
          packageDetails: null,
          gstPercentage,
          gstAmount,
          categoryName,
          vendorName,
        };
      })
    );

    const totalGst = updatedItems.reduce(
      (total, item) => total + item.gstAmount,
      0
    );
    const totalBeforeDiscount =
      totalOfCart + platformFee + platformGstAmount + totalGst;
    const totalAfterDiscount = Math.max(totalBeforeDiscount - discount, 0);

    const updatedCart = {
      ...cart.toObject(),
      items: updatedItems,
      totalOfCart,
      platformFee,
      platformGstAmount,
      totalGst,
      discount,
      code: cart?.appliedCoupon?.code,
      appliedCoupon,
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
    const { userId, packageId } = req.params;

    const cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.packageId.toString() !== packageId
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
