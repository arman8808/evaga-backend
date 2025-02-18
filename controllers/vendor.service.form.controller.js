import VendorServiceLisitingForm from "../modals/vendorServiceListingForm.modal.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { google } from "googleapis";
import { uploadToYouTube } from "./upload.Youtube.controller.js";
import { getPreSignedUrl } from "../utils/getPreSignedUrl.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
const CLIENT_SECRET_PATH = "./client_secret.json";
const TOKEN_PATH = "../token.json";
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const fileFields = [
  "CoverImage",
  "FloorPlan",
  "3DTour",
  "RecceReport",
  "Certifications",
  "ProductImage",
  "photos",
  "videos",
];
const generatePreSignedUrls = async (data) => {
  if (!data || typeof data !== "object") return data; // Skip invalid inputs

  let updatedObject = { ...data };

  for (const key of fileFields) {
    if (updatedObject[key]) {
      if (Array.isArray(updatedObject[key])) {
        // Convert array of file paths to presigned URLs
        updatedObject[key] = await Promise.all(
          updatedObject[key].map(async (fileKey) =>
            typeof fileKey === "string"
              ? await getPreSignedUrl(fileKey)
              : fileKey
          )
        );
      } else if (typeof updatedObject[key] === "string") {
        // Convert a single file path to presigned URL
        updatedObject[key] = await getPreSignedUrl(updatedObject[key]);
      }
    }
  }

  // If 'Portfolio' exists, handle its nested fields separately
  if (updatedObject.Portfolio) {
    updatedObject.Portfolio = await generatePreSignedUrls(
      updatedObject.Portfolio
    );
  }

  return updatedObject;
};

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
      let title = `Portfolio Video ${serviceIndex}`;
      service.values.forEach(async (value) => {
        const key = value.key;

        if (
          ["Title", "FoodTruckName", "VenueName"].includes(value.key) &&
          value.items
        ) {
          title = value.items;
        }

        if (key === "CoverImage") {
          value.items =
            req.files
              ?.filter(
                (file) => file.fieldname === `CoverImage_${serviceIndex}`
              )
              .map((file) => {
                if (!file.s3Location) {
                  console.warn(
                    `Missing s3Location for file: ${file.originalname}`
                  );
                  return null;
                }
                const baseUrl = `https://${process.env.PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

                return file.s3Location.startsWith(baseUrl)
                  ? file.s3Location.replace(baseUrl, "")
                  : file.s3Location;
              })
              .filter(Boolean) || [];
        } else if (key === "FloorPlan") {
          value.items =
            req.files
              ?.filter((file) => file.fieldname === `FloorPlan${serviceIndex}`)
              .map((file) => {
                if (!file.s3Location) {
                  console.warn(
                    `Missing s3Location for file: ${file.originalname}`
                  );
                  return null;
                }
                const baseUrl = `https://${process.env.PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

                return file.s3Location.startsWith(baseUrl)
                  ? file.s3Location.replace(baseUrl, "")
                  : file.s3Location;
              })
              .filter(Boolean) || [];
        } else if (key === "3DTour") {
          value.items =
            req.files
              ?.filter((file) => file.fieldname === `3DTour${serviceIndex}`)
              .map((file) => {
                if (!file.s3Location) {
                  console.warn(
                    `Missing s3Location for file: ${file.originalname}`
                  );
                  return null;
                }
                const baseUrl = `https://${process.env.PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

                return file.s3Location.startsWith(baseUrl)
                  ? file.s3Location.replace(baseUrl, "")
                  : file.s3Location;
              })
              .filter(Boolean) || [];
        } else if (key === "RecceReport") {
          value.items =
            req.files
              ?.filter(
                (file) => file.fieldname === `RecceReport${serviceIndex}`
              )
              .map((file) => {
                if (!file.s3Location) {
                  console.warn(
                    `Missing s3Location for file: ${file.originalname}`
                  );
                  return null;
                }
                const baseUrl = `https://${process.env.PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

                return file.s3Location.startsWith(baseUrl)
                  ? file.s3Location.replace(baseUrl, "")
                  : file.s3Location;
              })
              .filter(Boolean) || [];
        } else if (key === "Certifications") {
          value.items =
            req.files
              ?.filter(
                (file) => file.fieldname === `Certifications${serviceIndex}`
              )
              .map((file) => {
                if (!file.s3Location) {
                  console.warn(
                    `Missing s3Location for file: ${file.originalname}`
                  );
                  return null;
                }
                const baseUrl = `https://${process.env.PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

                return file.s3Location.startsWith(baseUrl)
                  ? file.s3Location.replace(baseUrl, "")
                  : file.s3Location;
              })
              .filter(Boolean) || [];
        } else if (key === "Portfolio") {
          // const videoFiles =
          //   req.files
          //     ?.filter((file) =>
          //       file.fieldname.startsWith(`Portfolio_videos_${serviceIndex}_`)
          //     )
          //     .map((file) => file.path) || [];

          // const uploadedVideos = [];
          // for (const video of videoFiles) {

          //   const youtubeURL =await uploadToYouTube(
          //     video,
          //     title,
          //     `Uploaded video for portfolio service index ${serviceIndex}`
          //   );
          //   console.log(youtubeURL);

          //   uploadedVideos.push(youtubeURL);
          // }

          // value.items = {
          //   photos:
          //     req.files
          //       ?.filter((file) =>
          //         file.fieldname.startsWith(`Portfolio_photos_${serviceIndex}_`)
          //       )
          //       .map((file) =>
          //         file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
          //       ) || [],
          //   videos: uploadedVideos,
          // };

          value.items = {
            photos:
              req.files
                ?.filter((file) =>
                  file.fieldname.startsWith(`Portfolio_photos_${serviceIndex}_`)
                )
                .map((file) => {
                  if (!file.s3Location) {
                    console.warn(
                      `Missing s3Location for file: ${file.originalname}`
                    );
                    return null;
                  }
                  const baseUrl = `https://${process.env.PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

                  return file.s3Location.startsWith(baseUrl)
                    ? file.s3Location.replace(baseUrl, "")
                    : file.s3Location;
                })
                .filter(Boolean) || [],
            videos:
              req.files
                ?.filter((file) =>
                  file.fieldname.startsWith(`Portfolio_videos_${serviceIndex}_`)
                )
                .map((file) => {
                  if (!file.s3Location) {
                    console.warn(
                      `Missing s3Location for file: ${file.originalname}`
                    );
                    return null;
                  }
                  const baseUrl = `https://${process.env.PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

                  return file.s3Location.startsWith(baseUrl)
                    ? file.s3Location.replace(baseUrl, "")
                    : file.s3Location;
                })
                .filter(Boolean) || [],
          };
        } else if (key === "ProductImage") {
          value.items =
            req.files
              ?.filter((file) =>
                file.fieldname.startsWith(`ProductImage_${serviceIndex}_`)
              )
              .slice(0, 3)
              .map((file) => {
                if (!file.s3Location) {
                  console.warn(
                    `Missing s3Location for file: ${file.originalname}`
                  );
                  return null;
                }
                const baseUrl = `https://${process.env.PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

                return file.s3Location.startsWith(baseUrl)
                  ? file.s3Location.replace(baseUrl, "")
                  : file.s3Location;
              })
              .filter(Boolean) || [];
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
                  .map((file) => {
                    if (!file.s3Location) {
                      console.warn(
                        `Missing s3Location for file: ${file.originalname}`
                      );
                      return null;
                    }
                    const baseUrl = `https://${process.env.PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

                    return file.s3Location.startsWith(baseUrl)
                      ? file.s3Location.replace(baseUrl, "")
                      : file.s3Location;
                  })
                  .filter(Boolean) || [];
            } else if (key === "Portfolio") {
              value.items = {
                photos:
                  req.files
                    ?.filter((file) =>
                      file.fieldname.startsWith(
                        `Portfolio_photos_cateringPackageVenue_${serviceIndex}_`
                      )
                    )
                    .map((file) => {
                      if (!file.s3Location) {
                        console.warn(
                          `Missing s3Location for file: ${file.originalname}`
                        );
                        return null;
                      }
                      const baseUrl = `https://${process.env.PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

                      return file.s3Location.startsWith(baseUrl)
                        ? file.s3Location.replace(baseUrl, "")
                        : file.s3Location;
                    })
                    .filter(Boolean) || [],
                videos:
                  req.files
                    ?.filter((file) =>
                      file.fieldname.startsWith(
                        `Portfolio_videos_cateringPackageVenue_${serviceIndex}_`
                      )
                    )
                    .map((file) => {
                      if (!file.s3Location) {
                        console.warn(
                          `Missing s3Location for file: ${file.originalname}`
                        );
                        return null;
                      }
                      const baseUrl = `https://${process.env.PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

                      return file.s3Location.startsWith(baseUrl)
                        ? file.s3Location.replace(baseUrl, "")
                        : file.s3Location;
                    })
                    .filter(Boolean) || [],
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
      .lean() // Convert Mongoose documents to plain objects
      .exec();

    if (!services) {
      return res.status(404).json({ error: "Vendor services not found" });
    }

    const updatedServices = services.map((service) => {
      const firstService = service.services?.[0]; // Access the first element of the `services` array
      const values = firstService ? { ...firstService.values } : null; // Extract `values` or return null if not found

      if (values) {
        delete values.Portfolio; // Remove the `Portfolio` field from `values`
      }

      // Return a new structure for each service
      return {
        _id: service._id,
        vendorId: service.vendorId,
        Category: service.Category,
        SubCategory: service.SubCategory,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        services: [
          {
            values, // Include modified `values` without `Portfolio`
          },
        ],
      };
    });

    res.status(200).json({
      message: "Vendor Service Fetch Successfully",
      services: updatedServices,
    });
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

// const updateOneVenderService = async (req, res) => {
//   const { serviceId } = req.params;
//   const { AbouttheService, YearofExperience } = req.body;

//   if (!AbouttheService || !YearofExperience) {
//     return res.status(400).json({
//       error: "All fields are required and cannot be empty",
//     });
//   }

//   try {
//     const vendorService = await VendorServiceLisitingForm.findById(serviceId);
//     if (!vendorService) {
//       return res.status(404).json({ error: "Vendor service not found" });
//     }
//     const newServices = JSON.parse(req.body.services);
//     if (!Array.isArray(newServices)) {
//       return res.status(400).json({ message: "Services array is required" });
//     }

//     const formattedServices = newServices.map((newService, serviceIndex) => {
//       const transformedValues = {};
//       const existingService = vendorService.services[serviceIndex] || {}; // Get old service

//       newService.values.forEach((value) => {
//         const key = value.key;
//         if (key === "Portfolio") {
//           const oldPhotos = existingService.values?.Portfolio?.photos || [];
//           const oldVideos = existingService.values?.Portfolio?.videos || [];

//           const newPhotos =
//             req.files
//               ?.filter((file) =>
//                 file.fieldname.startsWith(`Portfolio_photos_${serviceIndex}_`)
//               )
//               .map((file) =>
//                 file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//               ) || [];

//           const newVideos =
//             req.files
//               ?.filter((file) =>
//                 file.fieldname.startsWith(`Portfolio_videos_${serviceIndex}_`)
//               )
//               .map((file) =>
//                 file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//               ) || [];

//           const deletedPhotos = oldPhotos.filter(
//             (file) => !value.items.photos.includes(file)
//           );
//           const deletedVideos = oldVideos.filter(
//             (file) => !value.items.videos.includes(file)
//           );

//           [...deletedPhotos, ...deletedVideos].forEach((filePath) => {
//             const fullPath = path.join(__dirname, "../public", filePath);
//             if (fs.existsSync(fullPath)) {
//               fs.unlinkSync(fullPath);
//               console.log(`Deleted file: ${fullPath}`);
//             }
//           });
//           const cleanedPhotos = value.items.photos.filter(
//             (item) =>
//               !(typeof item === "object" && Object.keys(item).length === 0)
//           );
//           const cleanedVideos = value.items.videos.filter(
//             (item) =>
//               !(typeof item === "object" && Object.keys(item).length === 0)
//           );

//           transformedValues[key] = {
//             photos: [...cleanedPhotos, ...newPhotos],
//             videos: [...cleanedVideos, ...newVideos],
//           };
//         }
//         if (key === "CoverImage") {
//           const oldCoverImage = existingService.values instanceof Map
//             ? existingService.values.get('CoverImage')
//             : existingService.values?.CoverImage || null;

//           console.log("CoverImage:", oldCoverImage);

//           const newCoverImage =
//             req.files
//               ?.find((file) =>
//                 file.fieldname.startsWith(`CoverImage_${serviceIndex}_`)
//               )
//               ?.path.replace(/^public[\\/]/, "").replace(/\\/g, "/") || null;

//           if (newCoverImage && oldCoverImage) {
//             const oldImagePath = path.join(__dirname, "../public", oldCoverImage);
//             console.log("Old Image Path:", oldImagePath);
//             if (fs.existsSync(oldImagePath)) {
//               fs.unlinkSync(oldImagePath);
//               console.log(`Deleted old CoverImage: ${oldImagePath}`);
//             }
//           }

//           transformedValues[key] = newCoverImage || oldCoverImage;
//         }

//         else if (value.type === "radio") {
//           const selectedOption = value.selectedValue;
//           if (selectedOption) {
//             transformedValues[key] = selectedOption;
//           } else {
//             console.warn(`No selected value for key: ${key}`, value);
//             transformedValues[key] = null;
//           }
//         }
//         else {
//           if (Array.isArray(value.items)) {
//             const cleanedItems = value.items.filter(
//               (item) =>
//                 !(typeof item === "object" && Object.keys(item).length === 0)
//             );

//             const existingFiles = existingService.values?.[key] || [];
//             const newFiles =
//               req.files
//                 ?.filter((file) =>
//                   file.fieldname.startsWith(`${key}_${serviceIndex}`)
//                 )
//                 .map((file) =>
//                   file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")
//                 ) || [];

//             // Update transformedValues with cleaned items and new files
//             transformedValues[key] = [...cleanedItems, ...newFiles];
//           } else if (typeof value.items === "string") {
//             transformedValues[key] = value.items;
//           } else {
//             console.warn(`Unexpected format for key: ${key}`, value.items);
//             transformedValues[key] = value.items || null;
//           }
//         }

//       });

//       return {
//         menuTemplateId: newService.menuTemplateId || null,
//         values: transformedValues,
//         menu: newService.menu || null,
//         cateringValueInVenue: newService.cateringValueInVenue || null,
//         cateringPackageVenue: newService.cateringPackageVenue || null,
//       };
//     });

//     vendorService.services = formattedServices;
//     await vendorService.save();

//     res.status(200).json({
//       message: "Vendor services updated successfully",
//       updatedServices: vendorService.services,
//     });
//   } catch (error) {
//     console.log("Error updating vendor service:", error);
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
    return res
      .status(400)
      .json({ error: "All fields are required and cannot be empty" });
  }

  try {
    const vendorService = await VendorServiceLisitingForm.findById(serviceId);
    if (!vendorService) {
      return res.status(404).json({ error: "Vendor service not found" });
    }

    const newServices = JSON.parse(req.body.services);
    if (!Array.isArray(newServices)) {
      return res.status(400).json({ message: "Services array is required" });
    }

    const privateBucket = process.env.PRIVATE_BUCKET_NAME;
    const publicBucket = process.env.PUBLIC_BUCKET_NAME;

    const formattedServices = await Promise.all(
      newServices.map(async (newService, serviceIndex) => {
        const transformedValues = {};
        const existingService = vendorService.services[serviceIndex] || {};

        for (const value of newService.values) {
          const key = value.key;
          const type = value.type;
          if (type === "radio") {
            const selectedItem = value?.items.find((item) => item.checked);

            if (selectedItem) {
              value.items = selectedItem.value;
            }
          }
          if (key === "Portfolio") {
            const oldPhotos = existingService.values?.Portfolio?.photos || [];
            const oldVideos = existingService.values?.Portfolio?.videos || [];

            let newPhotos =
              req.files
                ?.filter((file) =>
                  file.fieldname.startsWith(`Portfolio_photos_${serviceIndex}_`)
                )
                .map((file) => {
                  if (!file.s3Location || typeof file.s3Location !== "string") {
                    console.warn(
                      `Missing or invalid s3Location for file: ${file.originalname}`
                    );
                    return null;
                  }
                  const baseUrl = `https://${process.env.PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

                  return file.s3Location.startsWith(baseUrl)
                    ? file.s3Location.replace(baseUrl, "")
                    : file.s3Location;
                })
                .filter(
                  (photo) => typeof photo === "string" && photo.trim() !== ""
                ) || [];

            let newVideos = req.files
              ?.filter((file) =>
                file.fieldname.startsWith(`Portfolio_videos_${serviceIndex}_`)
              )
              .map((file) => {
                const fileKey = extractS3Key(file.s3Location);
                if (!fileKey || typeof fileKey !== "string") {
                  console.warn(
                    `Invalid or missing video key for file: ${file.originalname}`
                  );
                  return null;
                }
                return fileKey;
              })
              .filter(
                (video) => typeof video === "string" && video.trim() !== ""
              );

            await Promise.all(
              [...oldPhotos, ...oldVideos].map(async (oldFileUrl) => {
                const fileKey = extractS3Key(oldFileUrl);
                if (fileKey) {
                  try {
                    await s3.send(
                      new DeleteObjectCommand({
                        Bucket: publicBucket,
                        Key: fileKey,
                      })
                    );
                    console.log(`Deleted from PUBLIC S3: ${fileKey}`);
                  } catch (err) {
                    console.error(
                      `Failed to delete from PUBLIC S3: ${fileKey}`,
                      err
                    );
                  }
                }
              })
            );

            const existingPhotos = value.items?.photos || [];
            const existingVideos = value.items?.videos || [];

            value.items = {
              photos: [...existingPhotos, ...newPhotos].filter(
                (photo) => typeof photo === "string" && photo.trim() !== ""
              ),

              videos: [...existingVideos, ...newVideos].filter(
                (video) => typeof video === "string" && video.trim() !== ""
              ),
            };
          }

          if (key === "CoverImage") {
            const oldCoverImage =
              existingService.values?.CoverImage?.[0] ||
              existingService.values?.CoverImage ||
              existingService.values?.get("CoverImage") ||
              null;

            const newCoverImage =
              req.files?.find((file) =>
                file.fieldname.startsWith(`CoverImage_${serviceIndex}_`)
              )?.s3Location || null;

            const extractedNewCoverImage = extractS3Key(newCoverImage);

            if (extractedNewCoverImage && oldCoverImage) {
              const oldKey = extractS3Key(oldCoverImage);
              if (oldKey) {
                try {
                  await s3.send(
                    new DeleteObjectCommand({
                      Bucket: publicBucket,
                      Key: oldKey,
                    })
                  );
                  console.log(
                    `Deleted old CoverImage from PUBLIC S3: ${oldKey}`
                  );
                } catch (err) {
                  console.error(
                    `Failed to delete old CoverImage: ${oldKey}`,
                    err
                  );
                }
              }
            }
            console.log(extractedNewCoverImage, "extractedNewCoverImage");

            value.items = extractedNewCoverImage || oldCoverImage;
          } else if (key === "ProductImage") {
            const oldImages = existingService.values?.ProductImage || [];

            let newImages =
              req.files
                ?.filter((file) =>
                  file.fieldname.startsWith(`ProductImage_${serviceIndex}_`)
                )
                .slice(0, 3)
                .map((file) => {
                  if (!file.s3Location || typeof file.s3Location !== "string") {
                    console.warn(
                      `Missing or invalid s3Location for file: ${file.originalname}`
                    );
                    return null;
                  }
                  const baseUrl = `https://${process.env.PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

                  return file.s3Location.startsWith(baseUrl)
                    ? file.s3Location.replace(baseUrl, "")
                    : file.s3Location;
                })
                .filter(
                  (image) => typeof image === "string" && image.trim() !== ""
                ) || [];
            console.log(newImages);

            // Delete old images from S3
            await Promise.all(
              oldImages.map(async (oldFileUrl) => {
                console.log(oldFileUrl, "oldFileUrl");

                const fileKey = extractS3Key(oldFileUrl);
                if (fileKey) {
                  try {
                    await s3.send(
                      new DeleteObjectCommand({
                        Bucket: publicBucket,
                        Key: fileKey,
                      })
                    );
                    console.log(`Deleted from PUBLIC S3: ${fileKey}`);
                  } catch (err) {
                    console.error(
                      `Failed to delete from PUBLIC S3: ${fileKey}`,
                      err
                    );
                  }
                }
              })
            );

            // Combine new and existing ProductImage items
            const existingImages = value.items || [];

            value.items = [...existingImages, ...newImages].filter(
              (image) => typeof image === "string" && image.trim() !== ""
            );
          } else {
            transformedValues[key] = value.items || null;
          }
          transformedValues[value.key] = value.items;
        }

        return {
          menuTemplateId: newService.menuTemplateId || null,
          values: transformedValues,
          menu: newService.menu || null,
          cateringValueInVenue: newService.cateringValueInVenue || null,
          cateringPackageVenue: newService.cateringPackageVenue || null,
        };
      })
    );

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

// ✅ Extracts the object key from an S3 URL
const extractS3Key = (s3Url) => {
  if (!s3Url || typeof s3Url !== "string") return null;
  const parts = s3Url.split("/");
  return parts.slice(-2).join("/"); // Extracts `service/compressed-xxxxx.jpg`
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
