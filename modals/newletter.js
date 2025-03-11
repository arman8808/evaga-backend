import mongoose from "mongoose";

const NewsLetterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: [true, "URL is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^(https?:\/\/)[\w.-]+(\.[\w\.-]+)+[\w\-\._~:/?#[\]@!$&'()*+,;=.]+$/g.test(
            v
          );
        },
        message: "Please provide a valid URL",
      },
    },
    status: {
      type: String,
      enum: ["publish", "unpublish"],
      required: [true, "Status is required"],
    },
  },
  {
    timestamps: true,
  }
);

const NewsLetter = mongoose.model("NewsLetter", NewsLetterSchema);
export default NewsLetter;
