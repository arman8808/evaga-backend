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
      values,
    } = req.body;
    console.log(
      vendorId,
      formTemplateId,
      Category,
      SubCategory,
      AbouttheService,
      YearofExperience,
      values
    );

    if (
      !vendorId ||
      !formTemplateId ||
      !Category ||
      !SubCategory ||
      !AbouttheService ||
      !YearofExperience ||
      !values
    ) {
      return res
        .status(400)
        .json({ message: "All fields are required and cannot be empty" });
    }

    const submission = new VendorServiceLisitingForm({
      vendorId,
      formTemplateId,
      Category,
      SubCategory,
      AbouttheService,
      YearofExperience,
      values,
    });

    await submission.save();
    res
      .status(201)
      .json({ message: "Form submission created successfully", submission });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create submission", error: error.message });
  }
};

export { addVenderService };
