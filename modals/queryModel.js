import mongoose from "mongoose";

const querySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "role",
    },
    role: {
      type: String,
      enum: ["User", "Venders"],
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Query = mongoose.model("Query", querySchema);
export default Query;
