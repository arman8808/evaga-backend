import VendorServiceLisitingForm from "../modals/vendorServiceListingForm.modal.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { google } from "googleapis";
const CLIENT_SECRET_PATH = "./client_secret.json"; // Path to your Google client secret
const TOKEN_PATH = "../token.json"; // Path to store access token
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

// Authenticate with Google and initialize OAuth2 client
const authenticateYouTube = async () => {
  try {
    // Read and parse the client secret JSON
    const credentials = JSON.parse(
      await fs.readFile(CLIENT_SECRET_PATH, "utf-8")
    );
    const { client_id, client_secret, redirect_uris } = credentials.installed;

    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );
    try {
      const token = JSON.parse(await fs.readFile(TOKEN_PATH, "utf-8"));
      oauth2Client.setCredentials(token);
      console.log("Google API successfully initialized and authenticated.");
    } catch (tokenError) {
      throw new Error(
        "No valid token found. Run a script to authenticate and save the token."
      );
    }

    return oauth2Client;
  } catch (error) {
    console.error("Error initializing Google API:", error.message);
    throw error;
  }
};

// Function to upload a video to YouTube
const uploadToYouTube = async (filePath, title, description) => {
  try {
    const auth = await authenticateYouTube();
    const youtube = google.youtube({ version: "v3", auth });

    const requestBody = {
      snippet: {
        title,
        description,
        tags: ["Vendor Service", "Automation"],
        categoryId: "22", // People & Blogs
      },
      status: {
        privacyStatus: "private", // Can be public, private, or unlisted
      },
    };

    const media = {
      body: fs.createReadStream(filePath),
    };

    const response = await youtube.videos.insert({
      part: "snippet,status",
      requestBody,
      media,
    });

    console.log("Video uploaded successfully:", response.data.id);
    return response.data.id;
  } catch (error) {
    console.error("Error uploading video:", error.message);
    throw error;
  }
};

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
                    file.fieldname.startsWith(
                      `CoverImage_cateringPackageVenue_${serviceIndex}`
                    )
                  )
                  .map((file) =>
                    file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
                  ) || [];
            } else if (key === "Portfolio") {
              value.items = {
                photos:
                  req.files
                    ?.filter((file) =>
                      file.fieldname.startsWith(
                        `Portfolio_photos_cateringPackageVenue_${serviceIndex}_`
                      )
                    )
                    .map((file) =>
                      file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
                    ) || [],
                videos:
                  req.files
                    ?.filter((file) =>
                      file.fieldname.startsWith(
                        `Portfolio_videos_cateringPackageVenue_${serviceIndex}_`
                      )
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
            transCateringPackageVenueValues[serviceIndex][value.key] =
              value.items;
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
// const updateOneVenderService = async (req, res) => {
//   const { serviceId } = req.params;
//   const { AbouttheService, YearofExperience } = req.body;
//   if (!AbouttheService || !YearofExperience) {
//     return res.status(400).json({
//       error: "All fields are required and cannot be empty",
//       missingFields: {
//         AbouttheService: !AbouttheService,
//         YearofExperience: !YearofExperience,
//       },
//     });
//   }
//   const services = JSON.parse(req.body.services);
//   if (!services || !Array.isArray(services)) {
//     return res.status(400).json({ message: "Services array is required" });
//   }

//   const formattedServices = services.map((service, serviceIndex) => {
//     const transformedValues = {};
//     const transMenuValues = {};
//     const transCateringValueInVenueValues = {};
//     const transCateringPackageVenueValues = {};

//     service.values.forEach((value) => {
//       const key = value.key;

//       if (key === "CoverImage") {
//         value.items =
//           req.files
//             ?.filter((file) => file.fieldname === `CoverImage_${serviceIndex}`)
//             .map((file) =>
//               file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//             ) || [];
//       } else if (key === "FloorPlan") {
//         value.items =
//           req.files
//             ?.filter((file) => file.fieldname === `FloorPlan${serviceIndex}`)
//             .map((file) =>
//               file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//             ) || [];
//       } else if (key === "3DTour") {
//         value.items =
//           req.files
//             ?.filter((file) => file.fieldname === `3DTour${serviceIndex}`)
//             .map((file) =>
//               file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//             ) || [];
//       } else if (key === "RecceReport") {
//         value.items =
//           req.files
//             ?.filter((file) => file.fieldname === `RecceReport${serviceIndex}`)
//             .map((file) =>
//               file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//             ) || [];
//       } else if (key === "Certifications") {
//         value.items =
//           req.files
//             ?.filter(
//               (file) => file.fieldname === `Certifications${serviceIndex}`
//             )
//             .map((file) =>
//               file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//             ) || [];
//       } else if (key === "Portfolio") {
//         value.items = {
//           photos:
//             req.files
//               ?.filter((file) =>
//                 file.fieldname.startsWith(`Portfolio_photos_${serviceIndex}_`)
//               )
//               .map((file) =>
//                 file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//               ) || [],
//           videos:
//             req.files
//               ?.filter((file) =>
//                 file.fieldname.startsWith(`Portfolio_videos_${serviceIndex}_`)
//               )
//               .map((file) =>
//                 file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//               ) || [],
//         };
//       } else if (key === "ProductImage") {
//         value.items =
//           req.files
//             ?.filter((file) =>
//               file.fieldname.startsWith(`ProductImage_${serviceIndex}_`)
//             )
//             .slice(0, 3) // Limit to a maximum of 3 files
//             .map((file) =>
//               file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//             ) || [];
//       }


//       transformedValues[value.key] = value.items;
//     });
//     service?.cateringPackageVenue?.forEach((value) => {
//       const key = value.key;

//       if (key === "CoverImage") {
//         value.items =
//           req.files
//             ?.filter(
//               (file) =>
//                 file.fieldname ===
//                 `CoverImage_cateringPackageVenue_${serviceIndex}`
//             )
//             .map((file) =>
//               file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//             ) || [];
//       } else if (key === "Portfolio") {
//         value.items = {
//           photos:
//             req.files
//               ?.filter((file) =>
//                 file.fieldname.startsWith(
//                   `Portfolio_photos_cateringPackageVenue_${serviceIndex}_`
//                 )
//               )
//               .map((file) =>
//                 file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//               ) || [],
//           videos:
//             req.files
//               ?.filter((file) =>
//                 file.fieldname.startsWith(
//                   `Portfolio_videos_cateringPackageVenue_${serviceIndex}_`
//                 )
//               )
//               .map((file) =>
//                 file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//               ) || [],
//         };
//       }

//       transCateringPackageVenueValues[value.key] = value.items;
//     });
//     // service?.menu?.forEach((value) => {
//     //   transMenuValues[value.key] = value?.items;
//     // });
//     if (Array.isArray(service.menu)) {
//       service?.menu.forEach((menuItem) => {
//         const { key, items } = menuItem;
//         transMenuValues[key] = items;
//       });
//     }
//     if (Array.isArray(service.menu)) {
//       service?.cateringValueInVenue?.forEach((menuItem) => {
//         const { key, items } = menuItem;
//         transCateringValueInVenueValues[key] = items;
//       });
//     }
//     console.log(transformedValues,'transformedValues');
    
//     return {
//       menuTemplateId: service.menuTemplateId || null,
//       values: transformedValues,
//       menu: transMenuValues || null,
//       cateringValueInVenue: transCateringValueInVenueValues || null,
//       cateringPackageVenue: transCateringPackageVenueValues || null,
//       status: service.status || false,
//       verifiedAt: service.verifiedAt || null,
//       verifiedBy: service.verifiedBy || null,
//       remarks: service.remarks || "",
//     };
//   });
//   try {
//     const vendorService = await VendorServiceLisitingForm.findById(serviceId);
//     console.log(vendorService, "vendorService", services);

//     if (!vendorService) {
//       return res.status(404).json({ error: "Vendor service not found" });
//     }


//     // Replace the existing services array with the updated one
//     vendorService.services = formattedServices;
//     //
//     await vendorService.save();

//     res.status(200).json({
//       message: "Vendor services updated successfully",
//       updatedServices: vendorService.services,
//     });
//   } catch (error) {
//     console.log(error);

//     res.status(500).json({
//       message: "Failed to update vendor services",
//       error: error.message,
//     });
//   }
// };




const updateOneVenderService = async (req, res) => {
  const { serviceId } = req.params;
  const { AbouttheService, YearofExperience } = req.body;

  if (!AbouttheService || !YearofExperience) {
    return res.status(400).json({
      error: "All fields are required and cannot be empty",
    });
  }

  try {
    const vendorService = await VendorServiceLisitingForm.findById(serviceId);
    if (!vendorService) {
      return res.status(404).json({ error: "Vendor service not found" });
    }

    // Parse services from request
    const newServices = JSON.parse(req.body.services);
    if (!Array.isArray(newServices)) {
      return res.status(400).json({ message: "Services array is required" });
    }

    // Prepare updated services array
    const formattedServices = newServices.map((newService, serviceIndex) => {
      const transformedValues = {};
      const existingService = vendorService.services[serviceIndex] || {}; // Get old service

      newService.values.forEach((value) => {
        const key = value.key;
        if (key === "Portfolio") {
          const oldPhotos = existingService.values?.Portfolio?.photos || [];
          const oldVideos = existingService.values?.Portfolio?.videos || [];
        
          const newPhotos = req.files
            ?.filter((file) =>
              file.fieldname.startsWith(`Portfolio_photos_${serviceIndex}_`)
            )
            .map((file) => file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")) || [];
        
          const newVideos = req.files
            ?.filter((file) =>
              file.fieldname.startsWith(`Portfolio_videos_${serviceIndex}_`)
            )
            .map((file) => file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")) || [];
        
          // 🔥 Find deleted files (present in old data but missing in new)
          const deletedPhotos = oldPhotos.filter((file) => !value.items.photos.includes(file));
          const deletedVideos = oldVideos.filter((file) => !value.items.videos.includes(file));
        
          // 🚨 Delete files from the server
          [...deletedPhotos, ...deletedVideos].forEach((filePath) => {
            const fullPath = path.join(__dirname, "../public", filePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log(`Deleted file: ${fullPath}`);
            }
          });
        
          // 🛠️ Clean photos and videos arrays by removing empty objects
          const cleanedPhotos = value.items.photos.filter(
            (item) => !(typeof item === "object" && Object.keys(item).length === 0)
          );
          const cleanedVideos = value.items.videos.filter(
            (item) => !(typeof item === "object" && Object.keys(item).length === 0)
          );
        
          // Store updated files in transformedValues
          transformedValues[key] = {
            photos: [...cleanedPhotos, ...newPhotos], // Cleaned old + new
            videos: [...cleanedVideos, ...newVideos], // Cleaned old + new
          };
        }
        
        else {
          if (Array.isArray(value.items)) {
            const cleanedItems = value.items.filter(
              (item) => !(typeof item === "object" && Object.keys(item).length === 0)
            );
      
            const existingFiles = existingService.values?.[key] || [];
            const newFiles = req.files
              ?.filter((file) => file.fieldname.startsWith(`${key}_${serviceIndex}`))
              .map((file) => file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")) || [];
      
            // Update transformedValues with cleaned items and new files
            transformedValues[key] = [...cleanedItems, ...newFiles];
          } else if (typeof value.items === "string") {
            transformedValues[key] = value.items;
          } else {
            console.warn(`Unexpected format for key: ${key}`, value.items);
            transformedValues[key] = value.items || null;
          }
        }
      });
      

      return {
        menuTemplateId: newService.menuTemplateId || null,
        values: transformedValues,
        menu: newService.menu || null,
        cateringValueInVenue: newService.cateringValueInVenue || null,
        cateringPackageVenue: newService.cateringPackageVenue || null,
      };
    });

    // 🔥 Update the vendor service
    vendorService.services = formattedServices;
    await vendorService.save();

    res.status(200).json({
      message: "Vendor services updated successfully",
      updatedServices: vendorService.services,
    });
  } catch (error) {
    console.log("Error updating vendor service:", error);
    res.status(500).json({
      message: "Failed to update vendor services",
      error: error.message,
    });
  }
};

const deleteFile = (filePath) => {
  console.log(`Attempting to delete file: ${filePath}`);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Failed to delete file: ${filePath}`, err);
    } else {
      console.log(`Successfully deleted file: ${filePath}`);
    }
  });
};

const deleteMediaFiles = (mediaObject, optionalMediaKeys) => {
  optionalMediaKeys.forEach((key) => {
    const nestedKeys = key.split(".");
    let mediaFiles = mediaObject;

    nestedKeys.forEach((nestedKey) => {
      mediaFiles = mediaFiles?.[nestedKey];
    });

    if (Array.isArray(mediaFiles)) {
      mediaFiles.forEach((filePath) => {
        const fullPath = path.join(__dirname, "..", "public", filePath);
        console.log(`Processing media file for deletion: ${fullPath}`);
        deleteFile(fullPath);
      });
    } else {
      console.log(`No media files found for key: ${key}`);
    }
  });
};

const deleteVenderService = async (req, res) => {
  const { serviceId, packageId } = req.params;

  try {
    // Find the service by ID
    const service = await VendorServiceLisitingForm.findById(serviceId);

    if (!service) {
      return res.status(404).json({ error: "Vendor service not found" });
    }

    // Find the package to delete
    const packageToDelete = service.services.find(
      (pkg) => pkg._id.toString() === packageId
    );

    if (!packageToDelete) {
      return res
        .status(404)
        .json({ error: "Package not found in the service" });
    }

    console.log("Package to delete:", JSON.stringify(packageToDelete, null, 2));

    // Delete optional media in values
    const optionalMediaKeys = [
      "Portfolio.photos",
      "Portfolio.videos",
      "3DTour",
      "FloorPlan",
      "RecceReport",
      "CertificationsAndLicenses",
      "ProductImage",
    ];

    if (packageToDelete.values) {
      console.log("Deleting optional media from 'values':");
      deleteMediaFiles(packageToDelete.values, optionalMediaKeys);
    } else {
      console.log("No 'values' object found in package.");
    }

    // Handle cateringPackageVenue
    if (Array.isArray(packageToDelete.cateringPackageVenue)) {
      console.log("Processing 'cateringPackageVenue':");

      packageToDelete.cateringPackageVenue.forEach((venueObject, index) => {
        console.log(
          `Processing venue object at index ${index}:`,
          JSON.stringify(venueObject, null, 2)
        );

        Object.values(venueObject).forEach((venue, keyIndex) => {
          console.log(
            `Processing venue at key ${keyIndex}:`,
            JSON.stringify(venue, null, 2)
          );

          // Delete CoverImage in venue
          if (venue?.CoverImage) {
            venue.CoverImage.forEach((imagePath) => {
              const fullPath = path.join(__dirname, "..", "public", imagePath);
              console.log(`Deleting CoverImage for venue: ${fullPath}`);
              deleteFile(fullPath);
            });
          }

          // Delete optional media in venue
          deleteMediaFiles(venue, optionalMediaKeys);
        });
      });
    } else {
      console.log("No 'cateringPackageVenue' found or it is not an array.");
    }

    // Check if this is the last package
    if (service.services.length === 1) {
      console.log("Last package detected, deleting the entire service.");
      await VendorServiceLisitingForm.findByIdAndDelete(serviceId);

      return res.status(200).json({
        message: "Vendor service and its package deleted successfully",
      });
    }

    // Otherwise, update the service by removing the specified package
    service.services = service.services.filter(
      (pkg) => pkg._id.toString() !== packageId
    );
    await service.save();

    console.log(
      "Package deleted successfully, service updated:",
      JSON.stringify(service, null, 2)
    );

    res.status(200).json({
      message: "Package deleted successfully from the service",
      data: service,
    });
  } catch (error) {
    console.error("Error occurred during deletion:", error);

    res.status(500).json({
      message: "Failed to delete vendor service or package",
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
  authenticateYouTube,
};
