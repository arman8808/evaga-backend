import User from "../modals/user.modal.js";
import userInterest from "../modals/userInterest.modal.js";

const saveUserInterests = async (req, res) => {
  const { interests } = req.body; // Expecting a string with comma-separated values
  const userId = req.user._id;

  if (!userId || !interests) {
    return res.status(400).json({ error: "Invalid userId or interests." });
  }

  try {
    const formattedInterests = interests
      .split(",")
      .map((interest) => interest.trim());

    let userInterestRecord = await userInterest.findOne({ userId });

    if (userInterestRecord) {
      userInterestRecord.interests = formattedInterests;
      await userInterestRecord.save();
    } else {
      // Create a new interest record
      userInterestRecord = new userInterest({
        userId,
        interests: formattedInterests,
      });
      await userInterestRecord.save();

      // Update the user's interestId field
      await User.findByIdAndUpdate(
        userId,
        { interestId: userInterestRecord._id, userInterestFilled: true },
        { new: true }
      );
    }

    res.status(200).json({
      message: userInterestRecord.isNew
        ? "Interests saved successfully."
        : "Interests updated successfully.",
      userInterest: userInterestRecord,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save interests." });
  }
};
export { saveUserInterests };
