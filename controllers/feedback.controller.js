import Feedback from "../modals/feedback.modal.js";

// Add feedback
const addFeedback = async (req, res) => {
  const {
    email,
    customer,
    phone,
    booking,
    bookAgain,
    comments,
    contact_preference,
    expectations,
    experience,
    information,
    interact,
    navigation,
    platform,
    rating,
    reason,
    recommend,
    service,
    serviceType,
    suggestions,
    support,
    technical,
    unique,
    vendor,
  } = req.body;

  try {
    // Create new feedback
    const newFeedback = new Feedback({
      email,
      customer,
      phone,
      booking,
      bookAgain,
      comments,
      contact_preference,
      expectations,
      experience,
      information,
      interact,
      navigation,
      platform,
      rating,
      reason,
      recommend,
      service,
      serviceType,
      suggestions,
      support,
      technical,
      unique,
      vendor,
    });

    await newFeedback.save();
    res
      .status(201)
      .json({ message: "Feedback submitted successfully!", data: newFeedback });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to submit feedback.", error: error.message });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json({ data: feedbacks });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch feedbacks.", error: error.message });
  }
};

// Get feedback by email
const getFeedbackByEmail = async (req, res) => {
  const { email } = req.params;

  try {
    const feedback = await Feedback.findOne({ email });
    if (!feedback) {
      return res
        .status(404)
        .json({ message: "Feedback not found for this email." });
    }
    res.status(200).json({ data: feedback });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch feedback.", error: error.message });
  }
};
export { getAllFeedback, addFeedback, getFeedbackByEmail };
