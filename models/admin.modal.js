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
      enum: ['super_admin', 'sub_admin'],
      // Ensure only these roles are allowed
    },
    permissions: {
      type: [String],
      default: [],
   
    },
    profilePicture: { type: String, required: false },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
