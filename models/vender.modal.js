import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const vendeerSchema = new mongoose.Schema(
  {
    venderID: { type: String, required: true },
    email: {
      type: String,
      required: function () {
        return !this.phoneNumber;
      },
      unique: true,
      sparse: true,
    },
    phoneNumber: {
      type: String,
      required: function () {
        return !this.email;
      },
      unique: true,
      sparse: true,
    },
    alternatePhoneNumber: { type: String },
    bio: { type: String },
    website: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
    },
    areaOfInterest: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    yearOfExperience: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    bankDetails: { type: mongoose.Schema.Types.ObjectId, ref: "BankDetails" },
    businessDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessDetails",
    },
    documents: [
      { type: mongoose.Schema.Types.ObjectId, ref: "venderDocument" },
    ],
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);
vendeerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

vendeerSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

vendeerSchema.methods.generateAccessToken = function (role) {
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
vendeerSchema.methods.generateRefreshToken = function (role) {
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
const Vender = mongoose.model("Vender", vendeerSchema);

export default Vender;
