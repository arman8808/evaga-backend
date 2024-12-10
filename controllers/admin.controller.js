import Admin from "../modals/admin.modal.js";

const options = {
  httpOnly: true,
  secure: true,
};
const generateAccessAndRefereshTokens = async (userId, role) => {
  try {
    const user = await Admin.findById(userId);
    const accessToken = user.generateAccessToken(role);
    const refreshToken = user.generateRefreshToken(role);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerAdmin = async (req, res) => {
  const { name, email, password, role, permissions } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists." });
    }
    const newAdmin = new Admin({
      name,
      email,
      password,
      role,
      permissions,
    });

    await newAdmin.save();
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      newAdmin._id,
      newAdmin.role
    );
    res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({ message: "Admin registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error });
  }
};

const loginAdmin = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: "Email or phone number is required" });
  }
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  try {
    const admin = await Admin.findOne(
      isEmail ? { email: identifier } : { phoneNumber: identifier }
    );
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const isPasswordCorrect = await admin.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      admin._id,
      admin.role
    );
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)

      .json({
        message: "Login successful",
        role: "admin",
        token: accessToken,
        userId: admin._id,
      });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error });
  }
};

const logoutAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    await Admin.findByIdAndUpdate(id, { $unset: { refreshToken: 1 } });
    res
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .status(200)
      .json({ message: "Logout successful." });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error });
  }
};
const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, permissions, profilePicture } = req.body;

  try {
    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      { name, email, role, permissions, profilePicture },
      { new: true }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    res.status(200).json(updatedAdmin);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error });
  }
};

const getOneAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error });
  }
};

const changePasswordAdmin = async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  try {
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }
    const isOldPasswordCorrect = await admin.isPasswordCorrect(oldPassword);
    if (!isOldPasswordCorrect) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error });
  }
};

const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedAdmin = await Admin.findByIdAndRemove(id);
    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    res.status(200).json({ message: "Admin deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error });
  }
};
export {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  updateAdmin,
  changePasswordAdmin,
  deleteAdmin,
  getOneAdmin,
};
