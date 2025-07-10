import mongoose from "mongoose";
import Feedback from "../modals/feedback.modal.js";

// Add feedback
const addFeedback = async (req, res) => {
  const {
    bookingProcess,
    customerCare,
    eventExecution,
    eventType,
    heardAbout,
    pricingClarity,
    recommend,
    responseTime,
    suggestions,
    email,
  } = req.body;

  try {
    const newFeedback = new Feedback({
      bookingProcess,
      customerCare,
      eventExecution,
      eventType,
      heardAbout,
      pricingClarity,
      recommend,
      responseTime,
      suggestions,
      email,
    });

    await newFeedback.save();
    res.status(201).json({
      message: "Feedback submitted successfully!",
      data: newFeedback,
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    res.status(500).json({
      message: "Failed to submit feedback.",
      error: error.message,
    });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json({ data: feedbacks });
  } catch (error) {
    console.error("Fetch feedbacks error:", error);
    res.status(500).json({
      message: "Failed to fetch feedbacks.",
      error: error.message,
    });
  }
};

const getFeedbackByEmail = async (req, res) => {
  const { id } = req.params; // Now using id parameter instead of email

  try {
    // Validate if id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid feedback ID format" });
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.status(200).json({ data: feedback });
  } catch (error) {
    console.error("Fetch feedback by ID error:", error);
    res.status(500).json({
      message: "Failed to fetch feedback",
      error: error.message,
    });
  }
};
export { getAllFeedback, addFeedback, getFeedbackByEmail };
