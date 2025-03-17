import Review from "../modals/review.modal.js";

const createReview = async (req, res) => {
  try {
    const { userId, serviceId, packageId, rating, review } = req.body;

    const newReview = new Review({
      userId,
      serviceId,
      packageId,
      rating,
      review,
    });

    const savedReview = await newReview.save();
    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: savedReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
};
const getReviewsByServiceAndPackage = async (req, res) => {
  try {
    const { serviceId, packageId } = req.query;

    let matchStage = {};
    if (serviceId) matchStage.serviceId = serviceId;
    if (packageId) matchStage.packageId = packageId;

    const reviews = await Review.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    if (reviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          reviews: [],
          averageRating: 0,
          ratingsCount: [],
        },
      });
    }

    const totalReviews = reviews.reduce((sum, item) => sum + item.count, 0);
    const averageRating =
      reviews.reduce((sum, item) => sum + item._id * item.count, 0) /
      totalReviews;

    const formattedRatings = reviews.map((item) => ({
      rating: item._id,
      count: item.count,
    }));

    const detailedReviews = await Review.find(matchStage)
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        reviews: detailedReviews,
        averageRating: averageRating.toFixed(2),
        ratingsCount: formattedRatings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

const getReviewsByServiceId = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const reviews = await Review.find({ serviceId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews by serviceId",
      error: error.message,
    });
  }
};

const getReviewsByPackageId = async (req, res) => {
  try {
    const { packageId } = req.params;
    const reviews = await Review.find({ packageId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews by packageId",
      error: error.message,
    });
  }
};

const getReviewsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ userId })
      .populate("serviceId packageId", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews by userId",
      error: error.message,
    });
  }
};

const getReviewById = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId).populate(
      "userId serviceId packageId",
      "name"
    );
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch review",
      error: error.message,
    });
  }
};
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const updates = req.body;

    const updatedReview = await Review.findByIdAndUpdate(reviewId, updates, {
      new: true,
    });
    if (!updatedReview) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }
    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: updatedReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const deletedReview = await Review.findByIdAndDelete(reviewId);
    if (!deletedReview) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

export {
  createReview,
  deleteReview,
  updateReview,
  getReviewById,
  getReviewsByPackageId,
  getReviewsByUserId,
  getReviewsByServiceAndPackage,
  getReviewsByServiceId,
};
