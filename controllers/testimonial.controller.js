import Testimonial from "../modals/testimonial.modal.js";

// ==================== ADMIN CONTROLLERS ====================

// Create Testimonial
const createTestimonial = async (req, res) => {
    const { name, title, testimonial, status } = req.body;

    if (!name || !title || !testimonial) {
        return res
            .status(400)
            .json({ error: "Name, title, and testimonial are required" });
    }

    try {
        const newTestimonial = new Testimonial({
            name,
            title,
            testimonial,
            status: status ?? false,
            image: req.file?.location || "",
            preview: req.file?.preview || null,
        });

        await newTestimonial.save();

        res.status(201).json({
            message: "Testimonial created successfully",
            testimonial: newTestimonial,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get All Testimonials (Admin) — with pagination, includes published & unpublished
const getAllTestimonialsAdmin = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const totalCount = await Testimonial.countDocuments();
        const testimonials = await Testimonial.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            testimonials,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get One Testimonial (Admin)
const getOneTestimonialAdmin = async (req, res) => {
    const { id } = req.params;

    try {
        const testimonial = await Testimonial.findById(id);

        if (!testimonial) {
            return res.status(404).json({ error: "Testimonial not found" });
        }

        res.status(200).json(testimonial);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Update Testimonial
const updateTestimonial = async (req, res) => {
    const { id } = req.params;
    const { name, title, testimonial, status } = req.body;

    try {
        const existing = await Testimonial.findById(id);

        if (!existing) {
            return res.status(404).json({ error: "Testimonial not found" });
        }

        existing.name = name ?? existing.name;
        existing.title = title ?? existing.title;
        existing.testimonial = testimonial ?? existing.testimonial;
        if (status !== undefined) {
            existing.status = status;
        }
        if (req.file?.location) {
            existing.image = req.file.location;
        }
        if (req.file?.preview) {
            existing.preview = req.file.preview;
        }

        await existing.save();

        res.status(200).json({
            message: "Testimonial updated successfully",
            testimonial: existing,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Delete Testimonial
const deleteTestimonial = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await Testimonial.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ error: "Testimonial not found" });
        }

        res.status(200).json({ message: "Testimonial deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ==================== USER / PUBLIC CONTROLLER ====================

// Get All Published Testimonials (User) — only status: true
const getAllTestimonialsForUser = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const totalCount = await Testimonial.countDocuments({ status: true });
        const testimonials = await Testimonial.find({ status: true })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            testimonials,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export {
    createTestimonial,
    getAllTestimonialsAdmin,
    getOneTestimonialAdmin,
    updateTestimonial,
    deleteTestimonial,
    getAllTestimonialsForUser,
};
