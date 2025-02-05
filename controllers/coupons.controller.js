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
      const { couponId, userId, email, orderAmount } = req.body;
  
      const coupon = await Coupon.findById(couponId);
  
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
  
      // If user already used the coupon
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
        // Apply percentage discount with optional cap
        discount = (coupon.discountPercentage / 100) * orderAmount;
        if (coupon.cap !== null) {
          discount = Math.min(discount, coupon.cap);
        }
      }
  
      // Update usage details for this user
      coupon.usersUsed.set(userId, {
        userId,
        email,
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
    const coupons = await Coupon.find().sort({createdAt:-1});
    res.status(200).json(coupons);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching coupons.", error: error.message });
  }
};
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);

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
export {
  createCoupon,
  getCoupons,
  validateCoupon,
  editCoupon,
  getCouponById,
  deleteCoupon,
};
