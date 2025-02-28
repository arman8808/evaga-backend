import Query from "../modals/queryModel.js";
import User from "../modals/user.modal.js";
import Vender from "../modals/vendor.modal.js";

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
const getAllQueries = async (req, res) => {
  const { role } = req.params;

  try {
    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }

    const queries = await Query.find({ role }).sort({ createdAt: -1 });

    if (!queries.length) {
      return res
        .status(200)
        .json({ message: `No queries found for the role: ${role}.` });
    }

    res.status(200).json({ queries });
  } catch (error) {
    res.status(500).json({ message: "Error fetching queries.", error });
  }
};
const getOneQueries = async (req, res) => {
  const { queryId } = req.params;

  try {
    // Fetch the query by its ID
    const query = await Query.findById(queryId);

    if (!query) {
      return res.status(404).json({ error: "No queries found for this ID." });
    }

    // Extract role and userId from the query
    const { role, userId } = query;

    // Determine the schema to search based on the role
    let userSchema;
    if (role === "User") {
      userSchema = User;
    } else if (role === "Venders") {
      userSchema = Vender; 
    } else {
      return res
        .status(400)
        .json({ error: "Invalid role specified in the query." });
    }

    const user = await userSchema.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ error: `No ${role} found for this userId.` });
    }

    res.status(200).json({
      query,
      userName: user.name,
      Email: user.email, 
      Phone: user.phoneNumber,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching query details.", error });
  }
};

export {
  createQuery,
  getUserQueries,
  getVendorQueries,
  getAllQueries,
  getOneQueries,
};
