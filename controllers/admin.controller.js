import { error } from "console";
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
      return res.status(400).json({ error: "Admin already exists." });
    }
    const newAdmin = new Admin({
      name,
      email,
      password,
      role,
      permissions,
    });

    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully" });
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

  
    if (!admin.status) {
      
      return res
        .status(403)
        .json({ error: "Your profile is inactive. Please contact support." });
    }

    const isPasswordCorrect = await admin.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

  
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      admin._id,
      admin.role
    );

    res.status(200).json({
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
  const { userId } = req.params;
  try {
    await Admin.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error });
  }
};
const updateAdmin = async (req, res) => {
  const { userId } = req.params;
  const { name, email, role, permissions, profilePicture, password, status } =
    req.body;

  try {
    const existingAdmin = await Admin.findById(userId);

    if (!existingAdmin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const updatedFields = {
      name: name ?? existingAdmin.name,
      email: email ?? existingAdmin.email,
      role: role ?? existingAdmin.role,
      permissions: permissions ?? existingAdmin.permissions,
      profilePicture: profilePicture ?? existingAdmin.profilePicture,
      status: status ?? existingAdmin.status,
    };

    if (password) {
      updatedFields.password = password;
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(userId, updatedFields, {
      new: true,
    });

    res.status(200).json(updatedAdmin);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error });
  }
};

const getOneAdmin = async (req, res) => {
  const { userId } = req.params;

  try {
    const admin = await Admin.findById(userId).select(
      "-password -updatedAt -createdAt -refreshToken"
    );
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error });
  }
};

const changePasswordAdmin = async (req, res) => {
  const { userId } = req.params;
  const { oldPassword, newPassword } = req.body;

  try {
    const admin = await Admin.findById(userId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found." });
    }
    const isOldPasswordCorrect = await admin.isPasswordCorrect(oldPassword);
    if (!isOldPasswordCorrect) {
      return res.status(400).json({ error: "Old password is incorrect." });
    }
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error });
  }
};

const deleteAdmin = async (req, res) => {
  const { userId } = req.params;

  try {
    const deletedAdmin = await Admin.findByIdAndDelete(userId);
    if (!deletedAdmin) {
      return res.status(404).json({ error: "Admin not found." });
    }

    res.status(200).json({ message: "Admin deleted successfully." });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Something went wrong.", error });
  }
};
const getAllAdmin = async (req, res) => {
  try {
    const admin = await Admin.find({ role: "sub_admin" })
      .sort({ createdAt: -1 })
      .select("-password -refreshToken -updatedAt -createdAt");
    if (!admin) {
      return res.status(404).json({ error: "Admin not found." });
    }

    res.status(200).json(admin);
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
  getAllAdmin,
};
