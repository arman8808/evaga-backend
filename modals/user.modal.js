import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema(
  {
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
    alternateNumber: {
      type: String,
    },

    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    name: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
    },
    faceBookLink: {
      type: String,
    },
    instagramLink: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    Otp: {
      type: String,
    },
    OtpExpires: {
      type: Date,
    },
    interestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userInterest",
    },
    userInterestFilled: {
      type: Boolean,
      default: false,
    },
    userAddresses: [{ type: mongoose.Schema.Types.ObjectId, ref: "userAddress" }],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (role) {
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
userSchema.methods.generateRefreshToken = function (role) {
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
const User = mongoose.model("User", userSchema);

export default User;
