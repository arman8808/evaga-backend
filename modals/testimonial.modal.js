import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        title: { type: String, required: true, trim: true },
        testimonial: { type: String, required: true },
        status: { type: Boolean, default: false },
        image: { type: String, required: false },
        preview: { type: String, required: false },
    },
    { timestamps: true }
);

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

export default Testimonial;
