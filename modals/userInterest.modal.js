import mongoose from "mongoose";

const userInterestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    interests: [{ type: String }],
  },
  { timestamps: true }
);

const userInterest = mongoose.model("userInterest", userInterestSchema);

export default userInterest;
