import Waitlist from "../modals/waitlist.modal.js";


const addToWaitlist = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const existingEntry = await Waitlist.findOne({ email });
    if (existingEntry) {
      return res
        .status(409)
        .json({ error: "This email is already on the waitlist." });
    }

    const newEntry = new Waitlist({ email });
    await newEntry.save();

    res
      .status(201)
      .json({
        message: "You have been added to the waitlist!",
        data: newEntry,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong.", error: error.message });
  }
};

const getWaitlist = async (req, res) => {
  try {
    const waitlist = await Waitlist.find().sort({ createdAt: -1 });
    res.status(200).json({ data: waitlist });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch the waitlist.", error: error.message });
  }
};
export { addToWaitlist, getWaitlist };
