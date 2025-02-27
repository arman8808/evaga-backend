import Query from "../modals/queryModel.js";

// Create a query
const createQuery = async (req, res) => {
  const { userId, role, subject, query } = req.body;

  if (!userId || !role || !subject || !query) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!["User", "Venders"].includes(role)) {
    return res
      .status(400)
      .json({ message: "Invalid role. Must be 'user' or 'vendor'." });
  }
console.log(userId, role, subject, query);

  try {
    const newQuery = new Query({ userId, role, subject, query });
    await newQuery.save();

    res
      .status(201)
      .json({ message: "Query created successfully.", query: newQuery });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ message: "Error creating query.", error });
  }
};

// Get all queries for a user
const getUserQueries = async (req, res) => {
  const { userId } = req.params;

  try {
    const queries = await Query.find({ userId, role: "user" });

    if (!queries.length) {
      return res
        .status(404)
        .json({ message: "No queries found for this user." });
    }

    res.status(200).json({ queries });
  } catch (error) {
    res.status(500).json({ message: "Error fetching queries.", error });
  }
};

// Get all queries for a vendor
const getVendorQueries = async (req, res) => {
  const { userId } = req.params;

  try {
    const queries = await Query.find({ userId, role: "vendor" });

    if (!queries.length) {
      return res
        .status(404)
        .json({ message: "No queries found for this vendor." });
    }

    res.status(200).json({ queries });
  } catch (error) {
    res.status(500).json({ message: "Error fetching queries.", error });
  }
};

export { createQuery, getUserQueries, getVendorQueries };
