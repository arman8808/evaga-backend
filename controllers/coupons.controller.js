import Cart from "../modals/Cart.modal.js";
import Coupon from "../modals/coupons.modal.js";

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      startDate,
      endDate,
      usageLimit,
      discountAmount,
      discountPercentage,
      cap,
      vendorId,
      categoryId,
      applyAutoCoupon,
      selectedpackage,
    } = req.body;

    if (!code || !startDate || !endDate || !usageLimit) {
      return res.status(400).json({
        message: "Code, startDate, endDate, and usageLimit are required.",
      });
    }

    if (!discountAmount && !discountPercentage) {
      return res.status(400).json({
        message:
          "Either discountAmount or discountPercentage must be provided.",
      });
    }
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({
        message: `Coupon code "${code}" already exists. Please use a different code.`,
      });
    }

    const coupon = new Coupon({
      code,
      startDate,
      endDate,
      usageLimit,
      discountAmount: discountAmount || null,
      discountPercentage: discountPercentage || null,
      cap: cap || null,
      categoryId: categoryId,
      vendorId: vendorId || null,
      applyAutoCoupon: applyAutoCoupon,
      selectedpackage: selectedpackage || null,
    });

    await coupon.save();
    res.status(201).json({ message: "Coupon created successfully.", coupon });
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .json({ message: "Error creating coupon.", error: error.message });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { couponCode, userId, orderAmount } = req.body;

    const coupon = await Coupon.findOne({ couponCode });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found." });
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

    let discount = 0;

    if (coupon.discountAmount) {
      // Apply fixed discount
      discount = coupon.discountAmount;
    } else if (coupon.discountPercentage) {
      discount = (coupon.discountPercentage / 100) * orderAmount;
      if (coupon.cap !== null) {
        discount = Math.min(discount, coupon.cap);
      }
    }

    // Update usage details for this user
    coupon.usersUsed.set(userId, {
      userId,
      usageCount: (userUsage?.usageCount || 0) + 1,
    });

    await coupon.save();

    res.status(200).json({
      message: "Coupon validated successfully.",
      discount: Math.min(discount, orderAmount), // Ensure discount doesn't exceed order amount
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error validating coupon.", error: error.message });
  }
};

const getCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;
    const query = {};
    if (search) {
      query.code = { $regex: search?.term, $options: "i" };
    }

    const totalCount = await Coupon.countDocuments(query);

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      coupons,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error fetching coupons.",
      error: error.message,
    });
  }
};
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id).populate({
      path: "vendorId",
      select: "name",
    });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    res.status(200).json(coupon);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching coupon.", error: error.message });
  }
};

const editCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      startDate,
      endDate,
      usageLimit,
      discountAmount,
      discountPercentage,
      cap,
      vendorId,
      categoryId,
      applyAutoCoupon,
    } = req.body;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    // Update fields if provided
    if (code) coupon.code = code;
    if (startDate) coupon.startDate = new Date(startDate);
    if (endDate) coupon.endDate = new Date(endDate);
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (discountAmount !== undefined) coupon.discountAmount = discountAmount;
    if (discountPercentage !== undefined)
      coupon.discountPercentage = discountPercentage;
    if (cap !== undefined) coupon.cap = cap;
    if (vendorId !== undefined) coupon.vendorId = vendorId;
    if (categoryId !== undefined) coupon.categoryId = categoryId;
    if (applyAutoCoupon !== undefined) coupon.applyAutoCoupon = applyAutoCoupon;

    await coupon.save();

    res.status(200).json({ message: "Coupon updated successfully.", coupon });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating coupon.", error: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCoupon = await Coupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    res.status(200).json({ message: "Coupon deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting coupon.", error: error.message });
  }
};
const getVendorCouponDiscount = async (req, res) => {
  const { catId } = req.params;
  try {
    const getCoupon = await Coupon.findById();
  } catch (error) {
    res.status(500).json({ message: "Error coupon.", error: error.message });
  }
};
const removeCoupon = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    if (!cart.appliedCoupon) {
      return res.status(400).json({ message: "No coupon applied to remove" });
    }

    const coupon = await Coupon.findOne({ code: cart.appliedCoupon.code });
    if (coupon) {
      const userUsage = coupon.usersUsed.get(userId);
      if (userUsage) {
        userUsage.usageCount = Math.max(userUsage.usageCount - 1, 0);
        coupon.usersUsed.set(userId, userUsage);
        await coupon.save();
      }
    }

    cart.appliedCoupon = {
      code: null,
      discount: 0,
    };
    await cart.save();

    res.status(200).json({ message: "Coupon removed successfully", cart });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export {
  createCoupon,
  getCoupons,
  validateCoupon,
  editCoupon,
  getCouponById,
  deleteCoupon,
  removeCoupon,
};
