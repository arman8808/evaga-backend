import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    coverImage: { type: String, required: true },
    title: { type: String, required: true },
    authorName: { type: String, required: false },
    content: { type: String, required: false },
    category: { type: String, required: false },
    publishedAt: { type: Date, default: Date.now },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;
