import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      default: "sub_admin", // Default to sub_admin if not specified
      enum: ["admin", "sub_admin"],
      // Ensure only these roles are allowed
    },
    permissions: {
      type: [String],
      default: [],
    },
    profilePicture: { type: String, required: false },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

adminSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

adminSchema.methods.generateAccessToken = function (role) {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
adminSchema.methods.generateRefreshToken = function (role) {
  return jwt.sign(
    {
      _id: this._id,
      role: role,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
