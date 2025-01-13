import { log } from "console";
import VendorServiceLisitingForm from "../modals/vendorServiceListingForm.modal.js";
import fs from "fs";
// const addVenderService = async (req, res) => {
//   const { vendorId } = req.params;
//   const {
//     formTemplateId,
//     Category,
//     SubCategory,
//     AbouttheService,
//     YearofExperience,
//   } = req.body;

//   if (!vendorId) {
//     return res.status(400).json({ error: "VendorId Is Required" });
//   }
//   try {
//     if (
//       !formTemplateId ||
//       !Category ||
//       !SubCategory ||
//       !AbouttheService ||
//       !YearofExperience
//     ) {
//       return res.status(400).json({
//         error: "All fields are required and cannot be empty",
//         missingFields: {
//           formTemplateId: !formTemplateId,
//           Category: !Category,
//           SubCategory: !SubCategory,
//           AbouttheService: !AbouttheService,
//           YearofExperience: !YearofExperience,
//         },
//       });
//     }

//     const services = JSON.parse(req.body.services);

//     const formattedServices = services.map((service, serviceIndex) => ({
//       ...service,
//       values: service.values.map((value) => {
//         const key = value.key;

//         if (key === "CoverImage") {
//           value.items = req.files
//             ?.filter((file) => file.fieldname === `CoverImage_${serviceIndex}`)
//             .map((file) =>
//               file.path.replace("public\\", "").replace(/\\/g, "/")
//             );
//         } else if (key === "Portfolio") {
//           value.items = {
//             photos: req.files
//               ?.filter((file) =>
//                 file.fieldname.startsWith(`Portfolio_photos_${serviceIndex}_`)
//               )
//               .map((file) =>
//                 file.path.replace("public\\", "").replace(/\\/g, "/")
//               ),
//             videos: req.files
//               ?.filter((file) =>
//                 file.fieldname.startsWith(`Portfolio_videos_${serviceIndex}_`)
//               )
//               .map((file) =>
//                 file.path.replace("public\\", "").replace(/\\/g, "/")
//               ),
//           };
//         }

//         return value;
//       }),
//     }));

//     const submission = new VendorServiceLisitingForm({
//       vendorId,
//       formTemplateId,
//       Category,
//       SubCategory,
//       AbouttheService,
//       YearofExperience,
//       services: formattedServices,
//     });

//     await submission.save();
//     res.status(201).json({ message: "Form submission created successfully" });
//   } catch (error) {
//     console.log(error);

//     res
//       .status(500)
//       .json({ message: "Failed to create submission", error: error.message });
//   }
// };
// const addVenderService = async (req, res) => {
//   const { vendorId } = req.params;
//   const {
//     formTemplateId,
//     Category,
//     SubCategory,
//     AbouttheService,
//     YearofExperience,
//   } = req.body;

//   if (!vendorId) {
//     return res.status(400).json({ error: "VendorId is required" });
//   }

//   try {
//     if (
//       !formTemplateId ||
//       !Category ||
//       !SubCategory ||
//       !AbouttheService ||
//       !YearofExperience
//     ) {
//       return res.status(400).json({
//         error: "All fields are required and cannot be empty",
//         missingFields: {
//           formTemplateId: !formTemplateId,
//           Category: !Category,
//           SubCategory: !SubCategory,
//           AbouttheService: !AbouttheService,
//           YearofExperience: !YearofExperience,
//         },
//       });
//     }

//     // Parse services from the request body
//     const services = JSON.parse(req.body.services);

//     // Transform the services data
//     const formattedServices = services.map((service, serviceIndex) => {
//       const transformedValues = {};

//       // Convert `values` array to a Map-compatible object
//       service.values.forEach(({ label, items }) => {
//         transformedValues[label] = items;
//       });

//       return {
//         menuTemplateId: service.menuTemplateId || null,
//         values: transformedValues, // Now in Map-compatible object format
//         menu: {}, // If needed, process `menu` similarly
//         status: service.status || false,
//         verifiedAt: service.verifiedAt || null,
//         verifiedBy: service.verifiedBy || null,
//         remarks: service.remarks || "",
//       };
//     });

//     // Create and save the submission
//     const submission = new VendorServiceLisitingForm({
//       vendorId,
//       formTemplateId,
//       Category,
//       SubCategory,
//       AbouttheService,
//       YearofExperience,
//       services: formattedServices,
//     });

//     await submission.save();
//     res.status(201).json({ message: "Form submission created successfully" });
//   } catch (error) {
//     console.error("Error creating submission:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to create submission", error: error.message });
//   }
// };

const addVenderService = async (req, res) => {
  const { vendorId } = req.params;
  const {
    formTemplateId,
    Category,
    SubCategory,
    AbouttheService,
    YearofExperience,
  } = req.body;

  if (!vendorId) {
    return res.status(400).json({ error: "VendorId is required" });
  }

  try {
    // Validate required fields
    if (
      !formTemplateId ||
      !Category ||
      !SubCategory ||
      !AbouttheService ||
      !YearofExperience
    ) {
      return res.status(400).json({
        error: "All fields are required and cannot be empty",
        missingFields: {
          formTemplateId: !formTemplateId,
          Category: !Category,
          SubCategory: !SubCategory,
          AbouttheService: !AbouttheService,
          YearofExperience: !YearofExperience,
        },
      });
    }

    const services = JSON.parse(req.body.services);

    const formattedServices = services.map((service, serviceIndex) => {
      const transformedValues = {};
      const transMenuValues = {};
      const transCateringValueInVenueValues = {};
      const transCateringPackageVenueValues = {};

      service.values.forEach((value) => {
        const key = value.key;

        if (key === "CoverImage") {
          value.items =
            req.files
              ?.filter(
                (file) => file.fieldname === `CoverImage_${serviceIndex}`
              )
              .map((file) =>
                file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
              ) || [];
        } else if (key === "FloorPlan") {
          value.items =
            req.files
              ?.filter((file) => file.fieldname === `FloorPlan${serviceIndex}`)
              .map((file) =>
                file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
              ) || [];
        } else if (key === "3DTour") {
          value.items =
            req.files
              ?.filter((file) => file.fieldname === `3DTour${serviceIndex}`)
              .map((file) =>
                file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
              ) || [];
        } else if (key === "RecceReport") {
          value.items =
            req.files
              ?.filter(
                (file) => file.fieldname === `RecceReport${serviceIndex}`
              )
              .map((file) =>
                file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
              ) || [];
        } else if (key === "Certifications") {
          value.items =
            req.files
              ?.filter(
                (file) => file.fieldname === `Certifications${serviceIndex}`
              )
              .map((file) =>
                file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
              ) || [];
        } else if (key === "Portfolio") {
          value.items = {
            photos:
              req.files
                ?.filter((file) =>
                  file.fieldname.startsWith(`Portfolio_photos_${serviceIndex}_`)
                )
                .map((file) =>
                  file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
                ) || [],
            videos:
              req.files
                ?.filter((file) =>
                  file.fieldname.startsWith(`Portfolio_videos_${serviceIndex}_`)
                )
                .map((file) =>
                  file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
                ) || [],
          };
        } else if (key === "ProductImage") {
          value.items =
            req.files
              ?.filter((file) =>
                file.fieldname.startsWith(`ProductImage_${serviceIndex}_`)
              )
              .slice(0, 3) // Limit to a maximum of 3 files
              .map((file) =>
                file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
              ) || [];
        }

        transformedValues[value.key] = value.items;
      });
      service?.cateringPackageVenue?.forEach((venueArray, serviceIndex) => {
        if (Array.isArray(venueArray)) {
          venueArray.forEach((value) => {
            const key = value.key;
      
            if (key === "CoverImage") {
              value.items =
                req.files
                  ?.filter((file) => 
                    file.fieldname.startsWith(`CoverImage_cateringPackageVenue_${serviceIndex}`)
                  )
                  .map((file) => 
                    file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
                  ) || [];
            }else if (key === "Portfolio") {
              value.items = {
                photos:
                  req.files
                    ?.filter((file) =>
                      file.fieldname.startsWith(`Portfolio_photos_cateringPackageVenue_${serviceIndex}_`)
                    )
                    .map((file) =>
                      file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
                    ) || [],
                videos:
                  req.files
                    ?.filter((file) =>
                      file.fieldname.startsWith(`Portfolio_videos_cateringPackageVenue_${serviceIndex}_`)
                    )
                    .map((file) =>
                      file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
                    ) || [],
              };
            }
      
            // Flatten data into an object instead of an array
            if (!transCateringPackageVenueValues[serviceIndex]) {
              transCateringPackageVenueValues[serviceIndex] = {};
            }
            transCateringPackageVenueValues[serviceIndex][value.key] = value.items;
          });
        }
      });
      
    
      
      
      // service?.menu?.forEach((value) => {
      //   transMenuValues[value.key] = value?.items;
      // });
      if (Array.isArray(service.menu)) {
        service?.menu.forEach((menuItem) => {
          const { key, items } = menuItem;
          transMenuValues[key] = items;
        });
      }
      if (Array.isArray(service.menu)) {
        service?.cateringValueInVenue?.forEach((menuItem) => {
          const { key, items } = menuItem;
          transCateringValueInVenueValues[key] = items;
        });
      }
      return {
        menuTemplateId: service.menuTemplateId || null,
        values: transformedValues,
        menu: transMenuValues || null,
        cateringValueInVenue: transCateringValueInVenueValues || null,
        cateringPackageVenue: transCateringPackageVenueValues || null,
        status: service.status || false,
        verifiedAt: service.verifiedAt || null,
        verifiedBy: service.verifiedBy || null,
        remarks: service.remarks || "",
      };
    });
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
    console.error("Error creating submission:", error);
    // Delete any uploaded files
    if (req.files) {
      req.files.forEach((file) => {
        const filePath = file.path.replace(/^public[\\/]/, "");
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting file:", filePath, err);
          }
        });
      });
    }
    console.log(error);
    
    res
      .status(500)
      .json({ message: "Failed to create submission", error: error.message });
  }
};

const getOneVenderService = async (req, res) => {
  const { serviceId } = req.params;

  try {
    const service = await VendorServiceLisitingForm.findById(serviceId)
      .populate({
        path: "Category",
        select: "name",
      })
      .populate({
        path: "SubCategory",
        select: "name",
      });

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
  const { vendorId } = req.params;
  if (!vendorId) {
    return res.status(400).json({ error: "Vendor ID is required" });
  }

  try {
    const services = await VendorServiceLisitingForm.find({
      vendorId: vendorId,
    })
      .populate({
        path: "Category",
        select: "name",
      })
      .populate({
        path: "SubCategory",
        select: "name",
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!services) {
      return res.status(404).json({ error: "Vendor services not found" });
    }

    res
      .status(200)
      .json({ message: "Vendor Service Fetch Successfully", services });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch vendor services",
      error: error.message,
    });
  }
};
const updateOneVenderService = async (req, res) => {
  const { serviceId } = req.params;
  const {
    AbouttheService,
    YearofExperience,
  } = req.body;
  if (
    !AbouttheService ||
    !YearofExperience
  ) {
    return res.status(400).json({
      error: "All fields are required and cannot be empty",
      missingFields: {
        AbouttheService: !AbouttheService,
        YearofExperience: !YearofExperience,
      },
    });
  }
  const services = JSON.parse(req.body.services);
  // if (!services || !Array.isArray(services)) {
  //   return res.status(400).json({ message: "Services array is required" });
  // }

  const formattedServices = services.map((service, serviceIndex) => {
    const transformedValues = {};
    const transMenuValues = {};
    const transCateringValueInVenueValues = {};
    const transCateringPackageVenueValues = {};

    service.values.forEach((value) => {
      const key = value.key;

      if (key === "CoverImage") {
        value.items =
          req.files
            ?.filter(
              (file) => file.fieldname === `CoverImage_${serviceIndex}`
            )
            .map((file) =>
              file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
            ) || [];
      } else if (key === "FloorPlan") {
        value.items =
          req.files
            ?.filter((file) => file.fieldname === `FloorPlan${serviceIndex}`)
            .map((file) =>
              file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
            ) || [];
      } else if (key === "3DTour") {
        value.items =
          req.files
            ?.filter((file) => file.fieldname === `3DTour${serviceIndex}`)
            .map((file) =>
              file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
            ) || [];
      } else if (key === "RecceReport") {
        value.items =
          req.files
            ?.filter(
              (file) => file.fieldname === `RecceReport${serviceIndex}`
            )
            .map((file) =>
              file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
            ) || [];
      } else if (key === "Certifications") {
        value.items =
          req.files
            ?.filter(
              (file) => file.fieldname === `Certifications${serviceIndex}`
            )
            .map((file) =>
              file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
            ) || [];
      } else if (key === "Portfolio") {
        value.items = {
          photos:
            req.files
              ?.filter((file) =>
                file.fieldname.startsWith(`Portfolio_photos_${serviceIndex}_`)
              )
              .map((file) =>
                file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
              ) || [],
          videos:
            req.files
              ?.filter((file) =>
                file.fieldname.startsWith(`Portfolio_videos_${serviceIndex}_`)
              )
              .map((file) =>
                file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
              ) || [],
        };
      } else if (key === "ProductImage") {
        value.items =
          req.files
            ?.filter((file) =>
              file.fieldname.startsWith(`ProductImage_${serviceIndex}_`)
            )
            .slice(0, 3) // Limit to a maximum of 3 files
            .map((file) =>
              file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
            ) || [];
      }

      transformedValues[value.key] = value.items;
    });
    service?.cateringPackageVenue?.forEach((value) => {
      const key = value.key;

      if (key === "CoverImage") {
        value.items =
          req.files
            ?.filter(
              (file) => file.fieldname === `CoverImage_cateringPackageVenue_${serviceIndex}`
            )
            .map((file) =>
              file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
            ) || [];
      }  else if (key === "Portfolio") {
        value.items = {
          photos:
            req.files
              ?.filter((file) =>
                file.fieldname.startsWith(`Portfolio_photos_cateringPackageVenue_${serviceIndex}_`)
              )
              .map((file) =>
                file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
              ) || [],
          videos:
            req.files
              ?.filter((file) =>
                file.fieldname.startsWith(`Portfolio_videos_cateringPackageVenue_${serviceIndex}_`)
              )
              .map((file) =>
                file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
              ) || [],
        };
      } 

      transCateringPackageVenueValues[value.key] = value.items;
    });
    // service?.menu?.forEach((value) => {
    //   transMenuValues[value.key] = value?.items;
    // });
    if (Array.isArray(service.menu)) {
      service?.menu.forEach((menuItem) => {
        const { key, items } = menuItem;
        transMenuValues[key] = items;
      });
    }
    if (Array.isArray(service.menu)) {
      service?.cateringValueInVenue?.forEach((menuItem) => {
        const { key, items } = menuItem;
        transCateringValueInVenueValues[key] = items;
      });
    }
    return {
      menuTemplateId: service.menuTemplateId || null,
      values: transformedValues,
      menu: transMenuValues || null,
      cateringValueInVenue: transCateringValueInVenueValues || null,
      cateringPackageVenue: transCateringPackageVenueValues || null,
      status: service.status || false,
      verifiedAt: service.verifiedAt || null,
      verifiedBy: service.verifiedBy || null,
      remarks: service.remarks || "",
    };
  });
  try {
    const vendorService = await VendorServiceLisitingForm.findById(serviceId);

    if (!vendorService) {
      return res.status(404).json({ error: "Vendor service not found" });
    }

    // Replace the existing services array with the updated one
//     vendorService.services = services;
// // 
//     await vendorService.save();

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
  const { serviceId, packageid } = req.params;
  const { remarks, status } = req.body;
  try {
    const verifiedService = await VendorServiceLisitingForm.findById(serviceId);

    if (!verifiedService) {
      return res.status(404).json({ error: "Vendor service not found" });
    }
    const packageToUpdate = verifiedService.services.find(
      (pkg) => pkg._id.toString() === packageid
    );

    if (!packageToUpdate) {
      return res
        .status(404)
        .json({ error: "Package not found in the service" });
    }

    packageToUpdate.status = status;
    packageToUpdate.remarks = remarks || "";
    packageToUpdate.verifiedAt = Date.now();
    packageToUpdate.verifiedBy = req.user._id;
    await verifiedService.save();

    res.status(200).json({
      message: "Vendor service Verification successfully",
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
