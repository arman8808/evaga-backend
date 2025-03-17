import ErrorLog from "../modals/errorLog.modal.js";


export const logError = async (req, res) => {
  try {
    const { type, message, source, lineno, colno, error, url } = req.body;

    if (!type || !message) {
      return res.status(400).json({ error: "Type and message are required." });
    }

    const errorLog = new ErrorLog({
      type,
      message,
      source,
      lineno,
      colno,
      error,
      url,
    });
    await errorLog.save();

    res.status(201).json({ message: "Error logged successfully", errorLog });
  } catch (err) {
    console.error("Error while logging:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllErrors = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const skip = (pageNum - 1) * limitNum;

    const logs = await ErrorLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalLogs = await ErrorLog.countDocuments();

    res.status(200).json({
      currentPage: pageNum,
      totalPages: Math.ceil(totalLogs / limitNum),
      totalLogs,
      logs,
    });
  } catch (err) {
    console.error("Error while fetching logs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getOneError = async (req, res) => {
    try {
      const { id } = req.params; // Extract the ID from the route parameters
  
      // Fetch the error log by ID
      const errorLog = await ErrorLog.findById(id);
  
      if (!errorLog) {
        // If no log is found, respond with a 404 status
        return res.status(404).json({ error: "Error log not found" });
      }
  
      // Respond with the found error log
      res.status(200).json(errorLog);
    } catch (err) {
      console.error("Error while fetching the log:", err);
  
      // Handle invalid ID format (e.g., malformed ObjectId)
      if (err.name === "CastError") {
        return res.status(400).json({ error: "Invalid ID format" });
      }
  
      // Handle other errors
      res.status(500).json({ error: "Internal server error" });
    }
  };
  