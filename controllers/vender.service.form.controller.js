import VendorServiceLisitingForm from "../models/venderServiceListingForm.modal.js";
const addVenderService = async (req, res) => {
  try {
    const {
      vendorId,
      formTemplateId,
      Category,
      SubCategory,
      AbouttheService,
      YearofExperience,
    } = req.body;
    if (
      !vendorId ||
      !formTemplateId ||
      !Category ||
      !SubCategory ||
      !AbouttheService ||
      !YearofExperience
    ) {
      return res
        .status(400)
        .json({ error: "All fields are required and cannot be empty" });
    }
    console.log(req.files);

    const services = JSON.parse(req.body.services);
    const formattedServices = services.map((service, serviceIndex) => ({
      ...service,
      values: service.values.map((value) => {
        const key = value.key;

        if (key === "CoverImage") {
          value.items = req.files[`CoverImage_${serviceIndex}`]?.map(
            (file) => file.path
          );
        } else if (key === "Portfolio") {
          value.items = {
            photos: req.files[`Portfolio_photos_${serviceIndex}`]?.map(
              (file) => file.path
            ),
            videos: req.files[`Portfolio_videos_${serviceIndex}`]?.map(
              (file) => file.path
            ),
          };
        }

        return value;
      }),
    }));

    const submission = new VendorServiceLisitingForm({
      vendorId,
      formTemplateId,
      Category,
      SubCategory,
      AbouttheService,
      YearofExperience,
      services: formattedServices,
    });

    await submission.save();
    res.status(201).json({ message: "Form submission created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create submission", error: error.message });
  }
};
const getOneVenderService = async (req, res) => {
  const { id } = req.params;

  try {
    const service = await VendorServiceLisitingForm.findById(id);

    if (!service) {
      return res.status(404).json({ error: "Vendor service not found" });
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch vendor service",
      error: error.message,
    });
  }
};
const getAllVenderService = async (req, res) => {
  try {
    const services = await VendorServiceLisitingForm.find();
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch vendor services",
      error: error.message,
    });
  }
};
const updateOneVenderService = async (req, res) => {
  const { id } = req.params;
  const { services } = req.body;

  if (!services || !Array.isArray(services)) {
    return res.status(400).json({ message: "Services array is required" });
  }

  try {
    const vendorService = await VendorServiceLisitingForm.findById(id);

    if (!vendorService) {
      return res.status(404).json({ error: "Vendor service not found" });
    }

    // Replace the existing services array with the updated one
    vendorService.services = services;

    await vendorService.save();

    res.status(200).json({
      message: "Vendor services updated successfully",
      updatedServices: vendorService.services,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update vendor services",
      error: error.message,
    });
  }
};
const deleteVenderService = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedService = await VendorServiceLisitingForm.findByIdAndDelete(
      id
    );

    if (!deletedService) {
      return res.status(404).json({ error: "Vendor service not found" });
    }

    res.status(200).json({ message: "Vendor service deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete vendor service",
      error: error.message,
    });
  }
};
const VerifyService = async (req, res) => {
  const { serviceId } = req.params;
  const { remarks } = req.body;

  try {
    const verifiedService = await VendorServiceLisitingForm.findByIdAndUpdate(
      serviceId,
      {
        status: true,
        verifiedAt: Date.now(),
        verifiedBy: req.user._id,
        remarks: remarks || "",
      },
      { new: true }
    );

    if (!verifiedService) {
      return res.status(404).json({ error: "Vendor service not found" });
    }

    res.status(200).json({
      message: "Vendor service verified successfully",
      verifiedService,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to verify vendor service",
      error: error.message,
    });
  }
};

export {
  addVenderService,
  getOneVenderService,
  getAllVenderService,
  updateOneVenderService,
  deleteVenderService,
  VerifyService,
};
