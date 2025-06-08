import Cart from "../modals/Cart.modal.js";
import { Category } from "../modals/categoryModel.js";
import Coupon from "../modals/coupons.modal.js";
import GstCategory from "../modals/gstCategory.modal.js";
import Vender from "../modals/vendor.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
import { checkVendorAvailability } from "./vendorCalendor.controller.js";
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
      security,
      setupCost,
      travelCharge,
      delivery,
    } = req.body;

    selectedSessions = selectedSessions ? JSON.parse(selectedSessions) : [];
    travelCharge = travelCharge ? JSON.parse(travelCharge) : [];
    if (travelCharge) {
      travelCharge = {
        FreeUpto: Number(travelCharge["Free Upto"]) || 0,
        Thereon: Number(travelCharge.thereon) || 0,
        uom: travelCharge.Uom || "Per Km",
      };
    } else {
      travelCharge = {
        FreeUpto: 0,
        Thereon: 0,
        uom: "Per Km",
      };
    }

    const basePrice = defaultPrice ? Number(defaultPrice) : 0;
    const service = await vendorServiceListingFormModal.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    const availabilityResponse = await checkVendorAvailability({
      vendorId,
      startDate: date,
    });

    if (!availabilityResponse.available) {
      return res.status(400).json({
        error:
          availabilityResponse.message ||
          "Vendor is unavailable for the selected date.",
      });
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

    const sessionsTotalPrice = sessions.reduce(
      (sum, session) => sum + session.sessionTotalPrice,
      0
    );
    const totalPrice =
      basePrice +
      sessionsTotalPrice +
      Number(setupCost) +
      Number(security) +
      Number(delivery);
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
        setupCost,
        security,
        delivery,
        travelCharge,
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
        setupCost: setupCost ? Number(setupCost) : 0,
        security: security ? Number(security) : 0,
        delivery: delivery ? Number(delivery) : 0,
        travelCharge,
      });
    }

    await cart.save();
    res.status(200).json({ message: "Item Added To Cart" });
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: error.message });
  }
};

// const getCart = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { couponCode } = req.query;
//     let discount = 0;
//     let appliedCoupon = null;
//     let categoryName = null;
//     let vendorName = null;

//     const cart = await Cart.findOne({ userId });

//     if (!cart) {
//       return res.status(200).json({ message: "Cart not found" });
//     }

//     const totalOfCart = cart.items.reduce(
//       (total, item) => total + item.totalPrice,
//       0
//     );
//     const platformFee = Math.min((totalOfCart * 2) / 100, 1000);
//     const gstPercentagePlatform = 18;
//     const platformGstAmount = Math.round(
//       (platformFee * gstPercentagePlatform) / 100
//     );

//     if (couponCode) {
//       const coupon = await Coupon.findOne({ code: couponCode });

//       if (!coupon) {
//         return res.status(404).json({ error: "Invalid coupon code." });
//       }

//       const now = new Date();
//       if (now < coupon.startDate || now > coupon.endDate) {
//         return res.status(400).json({ error: "Coupon Expired" });
//       }

//       const userUsage = coupon.usersUsed.get(userId);
//       if (userUsage && userUsage.usageCount >= coupon.usageLimit) {
//         return res
//           .status(400)
//           .json({ error: "Usage limit reached for this coupon." });
//       }

//       if (coupon.discountAmount) {
//         discount = coupon.discountAmount;
//       } else if (coupon.discountPercentage) {
//         discount = (coupon.discountPercentage / 100) * totalOfCart;
//         if (coupon.cap !== null) {
//           discount = Math.min(discount, coupon.cap);
//         }
//       }

//       discount = Math.min(discount, totalOfCart);
//       appliedCoupon = couponCode;

//       cart.appliedCoupon = { code: couponCode, discount };
//       await cart.save();

//       coupon.usersUsed.set(userId, {
//         userId,
//         usageCount: (userUsage?.usageCount || 0) + 1,
//       });
//       await coupon.save();
//     } else if (cart.appliedCoupon?.code) {
//       discount = cart.appliedCoupon.discount;
//       appliedCoupon = cart.appliedCoupon.code;
//     }

//     const updatedItems = await Promise.all(
//       cart.items.map(async (item) => {
//         const service = await vendorServiceListingFormModal.findById(
//           item.serviceId
//         );

//         let gstPercentage = 18;
//         let gstAmount = 0;
//         let itemDiscount = 0;
//         let finalAmount = item.totalPrice;
//         let packageDetails = null;
//         let categoryName = null;
//         let vendorName = null;

//         if (service) {
//           const matchingPackage = service.services.find(
//             (pkg) => pkg._id.toString() === item.packageId
//           );

//           if (matchingPackage) {
//             const values = Object.fromEntries(matchingPackage.values);
//             const {
//               CoverImage,
//               Title,
//               ProductImage,
//               VenueName,
//               FoodTruckName,
//             } = values;

//             const gstCategory = await GstCategory.findOne({
//               categoryId: service.Category,
//             });
//             if (gstCategory && gstCategory.gstRates.length > 0) {
//               const activeGst =
//                 gstCategory.gstRates[gstCategory.gstRates.length - 1];
//               gstPercentage = activeGst.gstPercentage || 18;
//             }

//             const category = await Category.findById(service.Category);
//             if (category) {
//               categoryName = category.name;
//             }

//             const vendor = await Vender.findById(service.vendorId);
//             if (vendor) {
//               vendorName = vendor.userName;
//             }

//             packageDetails = {
//               CoverImage,
//               Title,
//               ProductImage,
//               VenueName,
//               FoodTruckName,
//             };
//           }
//         }

//         itemDiscount = parseFloat(
//           ((item.totalPrice / totalOfCart) * discount).toFixed(2)
//         );
//         finalAmount = parseFloat((item.totalPrice - itemDiscount).toFixed(2));

//         gstAmount = parseFloat(
//           ((finalAmount * gstPercentage) / 100).toFixed(2)
//         );

//         item.itemDiscount = itemDiscount;
//         item.finalPrice = finalAmount;

//         return {
//           ...item._doc,
//           packageDetails,
//           gstPercentage,
//           gstAmount,
//           categoryName,
//           vendorName,
//           itemDiscount,
//           finalAmount,
//         };
//       })
//     );

//     cart.items = updatedItems.map((item) => ({
//       ...item,
//       itemDiscount: item.itemDiscount,
//       finalPrice: item.finalPrice,
//     }));
//     await cart.save();

//     const totalAfterDiscount = Math.max(totalOfCart - discount, 0);
//     const totalGst = updatedItems.reduce((total, item) => {
//       const itemPriceAfterDiscount =
//         (item.totalPrice / totalOfCart) * totalAfterDiscount;
//       const gstAmount = (itemPriceAfterDiscount * item.gstPercentage) / 100;
//       item.gstAmount = gstAmount;
//       return total + gstAmount;
//     }, 0);

//     const totalBeforeDiscount =
//       totalOfCart + platformFee + platformGstAmount + totalGst;
//     const finalTotalAfterDiscount = Math.max(totalBeforeDiscount - discount, 0);
//     const updatedCart = {
//       ...cart.toObject(),
//       items: updatedItems,
//       totalOfCart,
//       platformFee,
//       platformGstAmount,
//       totalGst,
//       discount,
//       code: cart?.appliedCoupon?.code,
//       appliedCoupon,
//       totalBeforeDiscount,
//       totalAfterDiscount: finalTotalAfterDiscount,
//     };

//     res.status(200).json(updatedCart);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

const getCart = async (req, res) => {
  try {
    console.log(`[getCart] Started for user: ${req.params.userId}`);
    const { userId } = req.params;
    const { couponCode } = req.query;
    let discount = 0;
    let appliedCoupon = null;

    // 1. Fetch the cart
    console.log(`[getCart] Fetching cart for user: ${userId}`);
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      console.log(`[getCart] Cart not found for user: ${userId}`);
      return res.status(200).json({ message: "Cart not found" });
    }
    console.log(`[getCart] Found cart with ${cart.items.length} items`);

    // 2. Calculate cart totals
    const totalOfCart = cart.items.reduce(
      (total, item) => total + item.totalPrice,
      0
    );
    const platformFee = Math.min((totalOfCart * 2) / 100, 1000);
    const gstPercentagePlatform = 18;
    const platformGstAmount = Math.round(
      (platformFee * gstPercentagePlatform) / 100
    );
    console.log(
      `[getCart] Cart totals calculated - Total: ${totalOfCart}, Platform Fee: ${platformFee}`
    );

    // 3. Process coupon if provided
    if (couponCode) {
      console.log(`[getCart] Processing coupon code: ${couponCode}`);
      const coupon = await Coupon.findOne({ code: couponCode });
      if (!coupon) {
        console.log(`[getCart] Coupon not found: ${couponCode}`);
        return res.status(404).json({ error: "Invalid coupon code." });
      }

      const now = new Date();
      if (now < coupon.startDate || now > coupon.endDate) {
        console.log(
          `[getCart] Coupon expired: ${couponCode} (Valid from ${coupon.startDate} to ${coupon.endDate})`
        );
        return res.status(400).json({ error: "Coupon Expired" });
      }

      const userUsage = coupon.usersUsed.get(userId);
      if (userUsage && userUsage.usageCount >= coupon.usageLimit) {
        console.log(
          `[getCart] Coupon usage limit reached for user ${userId}: ${userUsage.usageCount}/${coupon.usageLimit}`
        );
        return res
          .status(400)
          .json({ error: "Usage limit reached for this coupon." });
      }

      // Calculate discount amount
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

      // Update cart and coupon
      cart.appliedCoupon = { code: couponCode, discount };
      await cart.save();

      coupon.usersUsed.set(userId, {
        userId,
        usageCount: (userUsage?.usageCount || 0) + 1,
      });
      await coupon.save();
      console.log(
        `[getCart] Applied coupon ${couponCode} with discount: ${discount}`
      );
    } else if (cart.appliedCoupon?.code) {
      discount = cart.appliedCoupon.discount;
      appliedCoupon = cart.appliedCoupon.code;
      console.log(
        `[getCart] Using existing coupon ${appliedCoupon} with discount: ${discount}`
      );
    }

    // 4. Process cart items with enhanced error handling
    console.log(`[getCart] Processing ${cart.items.length} cart items`);
    const updatedItems = await Promise.all(
      cart.items.map(async (item, index) => {
        const itemLogPrefix = `[Item ${index + 1}/${cart.items.length} - ${
          item.serviceId
        }]`;
        try {
          console.log(`${itemLogPrefix} Fetching service details`);
          const service = await vendorServiceListingFormModal.findById(
            item.serviceId
          );
          if (!service) {
            console.warn(`${itemLogPrefix} Service not found`);
            return getDefaultItemResponse(item);
          }
          console.log(`${itemLogPrefix} Found service: ${service._id}`);

          // A. Get category name with robust ID handling
          let categoryName = null;
          if (service.Category) {
            try {
              const categoryId = service.Category._id || service.Category;
              console.log(
                `${itemLogPrefix} Looking up category: ${categoryId}`
              );
              const category = await Category.findById(categoryId).select(
                "name"
              );
              categoryName = category?.name || null;
              console.log(
                `${itemLogPrefix} Category result: ${
                  categoryName || "Not found"
                }`
              );
            } catch (categoryError) {
              console.error(
                `${itemLogPrefix} Category lookup failed:`,
                categoryError
              );
            }
          }

          // B. Get vendor name with robust ID handling
          let vendorName = null;
          if (service.vendorId) {
            try {
              const vendorId = service.vendorId._id || service.vendorId;
              console.log(`${itemLogPrefix} Looking up vendor: ${vendorId}`);
              const vendor = await Vender.findById(vendorId).select("userName");
              vendorName = vendor?.userName || null;
              console.log(
                `${itemLogPrefix} Vendor result: ${vendorName || "Not found"}`
              );
            } catch (vendorError) {
              console.error(
                `${itemLogPrefix} Vendor lookup failed:`,
                vendorError
              );
            }
          }

          // C. Get GST percentage
          let gstPercentage = 18;
          if (service.Category) {
            try {
              const categoryId = service.Category._id || service.Category;
              console.log(
                `${itemLogPrefix} Looking up GST for category: ${categoryId}`
              );
              const gstCategory = await GstCategory.findOne({ categoryId });
              if (gstCategory?.gstRates?.length > 0) {
                gstPercentage =
                  gstCategory.gstRates.slice(-1)[0].gstPercentage || 18;
              }
              console.log(`${itemLogPrefix} GST percentage: ${gstPercentage}`);
            } catch (gstError) {
              console.error(`${itemLogPrefix} GST lookup failed:`, gstError);
            }
          }

          // D. Find matching package
          let packageDetails = null;
          console.log(
            `${itemLogPrefix} Looking for package: ${item.packageId}`
          );
          const matchingPackage = service.services.find(
            (pkg) => pkg._id?.toString() === item.packageId?.toString()
          );

          if (matchingPackage) {
            try {
              console.log(`${itemLogPrefix} Found matching package`);
              const values = Object.fromEntries(matchingPackage.values);
              packageDetails = {
                CoverImage: values.CoverImage,
                Title: values.Title,
                ProductImage: values.ProductImage,
                VenueName: values.VenueName,
                FoodTruckName: values.FoodTruckName,
              };
              console.log(`${itemLogPrefix} Package details extracted`);
            } catch (packageError) {
              console.error(
                `${itemLogPrefix} Package processing failed:`,
                packageError
              );
            }
          } else {
            console.warn(
              `${itemLogPrefix} No matching package found in service`
            );
          }

          // E. Calculate item financials
          const itemDiscount = parseFloat(
            ((item.totalPrice / totalOfCart) * discount).toFixed(2)
          );
          const finalAmount = parseFloat(
            (item.totalPrice - itemDiscount).toFixed(2)
          );
          const gstAmount = parseFloat(
            ((finalAmount * gstPercentage) / 100).toFixed(2)
          );
          console.log(
            `${itemLogPrefix} Calculated financials - Discount: ${itemDiscount}, Final: ${finalAmount}, GST: ${gstAmount}`
          );

          return {
            ...item.toObject(),
            packageDetails,
            gstPercentage,
            gstAmount,
            categoryName,
            vendorName,
            itemDiscount,
            finalPrice: finalAmount,
          };
        } catch (itemError) {
          console.error(`${itemLogPrefix} Failed to process item:`, itemError);
          return getDefaultItemResponse(item);
        }
      })
    );

    // 5. Update cart items
    console.log(`[getCart] Updating cart with processed items`);
    cart.items = updatedItems.map((item) => ({
      ...item,
      itemDiscount: item.itemDiscount,
      finalPrice: item.finalPrice,
    }));
    await cart.save();

    // 6. Calculate final totals
    const totalAfterDiscount = Math.max(totalOfCart - discount, 0);
    const totalGst = updatedItems.reduce(
      (total, item) => total + item.gstAmount,
      0
    );

    const totalBeforeDiscount =
      totalOfCart + platformFee + platformGstAmount + totalGst;
    const finalTotalAfterDiscount = Math.max(totalBeforeDiscount - discount, 0);
    console.log(
      `[getCart] Final totals - Before discount: ${totalBeforeDiscount}, After discount: ${finalTotalAfterDiscount}`
    );

    // 7. Prepare final response
    const response = {
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
      totalAfterDiscount: finalTotalAfterDiscount,
    };

    console.log(`[getCart] Successfully processed cart for user: ${userId}`);
    res.status(200).json(response);
  } catch (error) {
    console.error("[getCart] Controller error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Helper function for default item response
function getDefaultItemResponse(item) {
  console.log(`[getCart] Returning default response for item: ${item._id}`);
  return {
    ...item.toObject(),
    packageDetails: null,
    gstPercentage: 18,
    gstAmount: 0,
    categoryName: null,
    vendorName: null,
    itemDiscount: 0,
    finalPrice: item.totalPrice,
  };
}


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
    console.log(error);

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
