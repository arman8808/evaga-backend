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
import Vender from "../modals/vendor.modal.js";
import sendEmailWithTemplete from "../utils/mailer.js";
import { Readable } from "stream";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";
import mongoose from "mongoose";
import { sendTemplateMessage } from "./wati.controller.js";
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
    // Find the coverImage file
    const coverImageFile = req.files?.find((file) =>
      file.fieldname.startsWith("CoverImage_")
    );

    let coverImageUrl = null;
    if (coverImageFile) {
      const publicBucket = process.env.PUBLIC_BUCKET_NAME;
      const s3Client = new S3Client({ region: process.env.AWS_REGION });

      const uniqueName = `${Date.now()}-${coverImageFile.originalname}`;
      const publicKey = `service/${uniqueName}`;

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: publicBucket,
          Key: publicKey,
          Body: Readable.from(coverImageFile.buffer),
          ContentType: coverImageFile.mimetype,
        },
        partSize: 5 * 1024 * 1024,
      });

      await upload.done();
      console.log(`Uploaded coverImage to public bucket: ${publicKey}`);

      coverImageUrl = `${publicKey}`;
    }

    const submission = new VendorServiceLisitingForm({
      vendorId,
      formTemplateId,
      Category,
      SubCategory,
      AbouttheService,
      YearofExperience,
      services: services.map((service) => ({
        menuTemplateId: service.menuTemplateId || null,
        values: service.values.reduce((acc, value) => {
          console.log(acc[value.key], value.items);

          acc[value.key] = value.items;

          if (value.key === "CoverImage" && coverImageUrl) {
            acc[value.key] = [coverImageUrl];
          }

          return acc;
        }, {}),
        menu: service.menu || null,
        cateringValueInVenue: service.cateringValueInVenue || null,
        cateringPackageVenue: service.cateringPackageVenue || null,
        status: service.status || false,
        verifiedAt: service.verifiedAt || null,
        verifiedBy: service.verifiedBy || null,
        remarks: service.remarks || "",
      })),
    });

    await submission.save();

    res.status(201).json({
      message:
        "Form submission created successfully and files are uploading. Please wait until the upload process is complete before navigating away from the page.",
    });

    processFilesAsync(req.files, services, submission._id, vendorId);
  } catch (error) {
    console.error("Error creating submission:", error);

    if (req.files) {
      req.files.forEach((file) => {
        const filePath = file?.path?.replace(/^public[\\/]/, "");
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting file:", filePath, err);
          }
        });
      });
    }

    res
      .status(500)
      .json({ message: "Failed to create submission", error: error.message });
  }
};

const processFilesAsync = async (files, services, submissionId, vendorId) => {
  try {
    const publicBucket = process.env.PUBLIC_BUCKET_NAME;
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    await Promise.all(
      files.map(async (file) => {
        const { mimetype, originalname, buffer } = file;
        const fileStream = Readable.from(buffer);

        const uniqueName = `${Date.now()}-${originalname}`;
        const publicKey = `service/${uniqueName}`;

        const upload = new Upload({
          client: s3Client,
          params: {
            Bucket: publicBucket,
            Key: publicKey,
            Body: fileStream,
            ContentType: mimetype,
          },
          partSize: 5 * 1024 * 1024,
        });

        upload.on("httpUploadProgress", (progress) => {
          const uploadedMB = (progress.loaded / (1024 * 1024)).toFixed(2);
          console.log(
            `Uploading ${originalname}: ${uploadedMB} MB uploaded${
              progress.total
                ? ` of ${(progress.total / (1024 * 1024)).toFixed(2)} MB`
                : ""
            }`
          );
        });

        try {
          await upload.done();
          console.log(`Uploaded file to public bucket: ${publicKey}`);

          file.s3Location = `https://${publicBucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${publicKey}`;
        } catch (uploadError) {
          console.error(`Error uploading ${originalname}:`, uploadError);
          throw uploadError;
        }
      })
    );
    const existingSubmission = await VendorServiceLisitingForm.findById(
      submissionId
    );
    if (!existingSubmission) {
      throw new Error("Submission not found");
    }
    const formattedServices = services.map((service, serviceIndex) => {
      const existingService = existingSubmission.services[serviceIndex];

      const sku =
        existingService?.sku ||
        generateUniqueSKU(mongoose.model("VendorServiceLisitingForm"));
      const transformedValues = {};
      const transMenuValues = {};
      const transCateringValueInVenueValues = {};
      const transCateringPackageVenueValues = {};
      let title = `Portfolio Video ${serviceIndex}`;

      service.values.forEach((value) => {
        const key = value.key;

        if (
          ["Title", "FoodTruckName", "VenueName"].includes(value.key) &&
          value.items
        ) {
          title = value.items;
        }

        if (key === "CoverImage") {
          value.items =
            files
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
        }

        if (key === "FloorPlan") {
          value.items =
            files
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
            files
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
            files
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
            files
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
          value.items = {
            photos:
              files
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
              files
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
            files
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

      service?.cateringPackageVenue?.forEach((venueArray, venueIndex) => {
        if (Array.isArray(venueArray)) {
          venueArray.forEach((value) => {
            const key = value.key;

            if (key === "CoverImage") {
              value.items =
                files
                  ?.filter((file) =>
                    file.fieldname.startsWith(
                      `CoverImage_cateringPackageVenue_${venueIndex}`
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
                  files
                    ?.filter((file) =>
                      file.fieldname.startsWith(
                        `Portfolio_photos_cateringPackageVenue_${venueIndex}_`
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
                  files
                    ?.filter((file) =>
                      file.fieldname.startsWith(
                        `Portfolio_videos_cateringPackageVenue_${venueIndex}_`
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
            if (!transCateringPackageVenueValues[venueIndex]) {
              transCateringPackageVenueValues[venueIndex] = {};
            }
            transCateringPackageVenueValues[venueIndex][value.key] =
              value.items;
          });
        }
      });

      if (Array.isArray(service.menu)) {
        service.menu.forEach((menuItem) => {
          const { key, items } = menuItem;
          transMenuValues[key] = items;
        });
      }
      if (Array.isArray(service.cateringValueInVenue)) {
        service.cateringValueInVenue.forEach((menuItem) => {
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
        sku: sku,
      };
    });

    await VendorServiceLisitingForm.findByIdAndUpdate(submissionId, {
      services: formattedServices,
    });

    const vendor = await Vender.findById(vendorId);
    await sendEmailWithTemplete(
      "vendorSeviceAddNewService",
      vendor?.email,
      "Your Services Are Under Review – Next Steps",
      {
        vendorName: vendor?.name,
      }
    );
  } catch (error) {
    console.error("Error processing files:", error);
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
        AbouttheService: service.AbouttheService,
        YearofExperience: service.YearofExperience,
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

    const publicBucket = process.env.PUBLIC_BUCKET_NAME;

    const formattedServices = await Promise.all(
      newServices.map(async (newService, serviceIndex) => {
        const transformedValues = {};
        const existingService = vendorService.services[serviceIndex] || {};

        const sku =
          existingService.sku ||
          (await generateUniqueSKU(
            mongoose.model("VendorServiceLisitingForm")
          ));

        for (const value of newService.values) {
          const key = value.key;
          const type = value.type;

          if (key === "AddOns" || key === "Package") {
            const isEffectivelyEmpty =
              Array.isArray(value.items) &&
              value.items.every((item) =>
                Object.values(item).every((val) => val === "")
              );

            if (isEffectivelyEmpty) {
              transformedValues[key] = null;
              continue;
            }
          }
          if (key === "CustomThemeRequest") {
            const selectedOption = value.items.find((item) => item.checked);

            if (selectedOption) {
              transformedValues[key] = selectedOption.key;
            } else {
              transformedValues[key] = "No";
            }
            continue;
          }

          if (type === "radio") {
            const selectedItem = value?.items.find((item) => item.checked);
            if (selectedItem) {
              value.items = selectedItem.value;
            }
          }

          if (key === "Portfolio") {
            const oldPhotos = existingService.values?.Portfolio?.photos || [];
            const oldVideos = existingService.values?.Portfolio?.videos || [];

            // Extract preserved photos (strings) from the request body
            const preservedPhotos =
              value.items?.photos?.filter(
                (photo) => typeof photo === "string"
              ) || [];

            // Extract preserved videos (strings) from the request body
            const preservedVideos =
              value.items?.videos?.filter(
                (video) => typeof video === "string"
              ) || [];

            // Upload new photos (binary files) from `req.files`
            const newPhotos = await uploadFilesToS3(
              req.files,
              `Portfolio_photos_${serviceIndex}_`,
              publicBucket
            );

            // Upload new videos (binary files) from `req.files`
            const newVideos = await uploadFilesToS3(
              req.files,
              `Portfolio_videos_${serviceIndex}_`,
              publicBucket
            );

            // Identify photos to delete (existing photos not in the new payload)
            const photosToDelete = oldPhotos.filter(
              (photo) => !preservedPhotos.includes(photo)
            );

            // Identify videos to delete (existing videos not in the new payload)
            const videosToDelete = oldVideos.filter(
              (video) => !preservedVideos.includes(video)
            );

            // Delete old photos and videos from S3
            await deleteFilesFromS3(
              [...photosToDelete, ...videosToDelete],
              publicBucket
            );

            // Combine preserved and new photos and videos
            value.items = {
              photos: [...preservedPhotos, ...newPhotos].filter(Boolean),
              videos: [...preservedVideos, ...newVideos].filter(Boolean),
            };
          }

          if (key === "CoverImage") {
            // Get the existing CoverImage from the database (if any)
            const oldCoverImage =
              existingService.values?.CoverImage?.[0] || null;

            // Ensure value.items is always an array
            const preservedCoverImage = Array.isArray(value.items)
              ? value.items[0] // If it's already an array, take the first item
              : value.items; // If it's a string, use it directly

            // Check if a new CoverImage is provided in `req.files`
            const newCoverImage = req.files
              ? await uploadFilesToS3(
                  req.files,
                  `CoverImage_${serviceIndex}_`,
                  publicBucket,
                  1 // Limit to 1 image
                )
              : null;

            // Determine the final CoverImage to use
            if (newCoverImage && newCoverImage[0]) {
              // If a new CoverImage is uploaded, use it
              value.items = [newCoverImage[0]]; // Store as an array

              // Delete the old CoverImage if it exists and is different from the new one
              if (oldCoverImage && oldCoverImage !== newCoverImage[0]) {
                await deleteFilesFromS3([oldCoverImage], publicBucket);
              }
            } else if (preservedCoverImage) {
              // If no new CoverImage is uploaded but a preserved one exists, use it
              value.items = [preservedCoverImage]; // Store as an array
            } else {
              // If no new or preserved CoverImage is available, keep the old one
              value.items = oldCoverImage ? [oldCoverImage] : []; // Store as an array
            }
          }

          if (key === "ProductImage") {
            const oldImages = existingService.values?.ProductImage || [];
            const preservedImages =
              value.items?.filter((image) => typeof image === "string") || [];
            const newImages = await uploadFilesToS3(
              req.files,
              `ProductImage_${serviceIndex}_`,
              publicBucket,
              3
            );

            const imagesToDelete = oldImages.filter(
              (image) => !preservedImages.includes(image)
            );

            await deleteFilesFromS3(imagesToDelete, publicBucket);

            value.items = [...preservedImages, ...newImages].filter(Boolean);
          }

          transformedValues[key] = value.items || null;
        }

        return {
          menuTemplateId: newService.menuTemplateId || null,
          values: transformedValues,
          menu: newService.menu || null,
          cateringValueInVenue: newService.cateringValueInVenue || null,
          cateringPackageVenue: newService.cateringPackageVenue || null,
          sku, // Ensure sku is always defined
        };
      })
    );

    // Update the vendor service
    vendorService.services = formattedServices;
    vendorService.AbouttheService = AbouttheService;
    vendorService.YearofExperience = YearofExperience;

    await vendorService.save();

    res.status(200).json({
      message: "Vendor services updated successfully",
      updatedServices: vendorService.services,
    });
  } catch (error) {
    console.error("Error updating vendor service:", error);
    res.status(500).json({
      message: "Failed to update vendor services",
      error: error.message,
    });
  }
};

const uploadFilesToS3 = async (
  files,
  fieldPrefix,
  bucket,
  limit = Infinity
) => {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });

  const filteredFiles = files
    .filter((file) => file.fieldname.startsWith(fieldPrefix))
    .slice(0, limit);

  const uploadedUrls = await Promise.all(
    filteredFiles.map(async (file) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      const publicKey = `service/${uniqueName}`;

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: bucket,
          Key: publicKey,
          Body: Readable.from(file.buffer),
          ContentType: file.mimetype,
        },
        partSize: 5 * 1024 * 1024, // 5 MB chunks
      });

      await upload.done();
      console.log(`Uploaded file to S3: ${publicKey}`);

      return `${publicKey}`;
    })
  );

  return uploadedUrls;
};
const deleteFilesFromS3 = async (fileUrls, bucket) => {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });

  await Promise.all(
    fileUrls.map(async (fileUrl) => {
      const fileKey = extractS3Key(fileUrl);
      if (fileKey) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: fileKey,
            })
          );
          console.log(`Deleted from S3: ${fileKey}`);
        } catch (err) {
          console.error(`Failed to delete from S3: ${fileKey}`, err);
        }
      }
    })
  );
};

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
  const { remarks, status, packageStatus } = req.body;
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
    packageToUpdate.packageStatus = packageStatus;
    packageToUpdate.remarks = remarks || "";
    packageToUpdate.verifiedAt = Date.now();
    packageToUpdate.verifiedBy = req.user._id;
    await verifiedService.save();
    res.status(200).json({
      message: "Vendor service Verification successfully",
    });
    const vendor = await Vender.findById(verifiedService?.vendorId);
    await sendEmailWithTemplete(
      "vendorServiceauditnotification",
      vendor?.email,
      "🎉 Your Services Are Live on Evaga!",
      {
        vendorName: vendor?.name,
        emailTitle: "🎉 Your Services Are Live on Evaga!",
        dashboardLink: "https://evagaentertainment.com",
      }
    );
    await sendTemplateMessage(
      vendor?.phoneNumber,
      "service_live_notification",
      []
    );
  } catch (error) {
    res.status(500).json({
      message: "Failed to verify vendor service",
      error: error.message,
    });
  }
};

const generateUniqueSKU = async () => {
  let sku;
  let isUnique = false;

  while (!isUnique) {
    sku = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit number
    const existingDoc = await VendorServiceLisitingForm.findOne({
      "services.sku": sku,
    });
    if (!existingDoc) {
      isUnique = true;
    }
  }

  return sku;
};

// Migration script
const addSKUsToExistingDocuments = async () => {
  try {
    const documents = await VendorServiceLisitingForm.find();

    for (let doc of documents) {
      let isUpdated = false;

      for (let service of doc.services) {
        if (!service.sku) {
          service.sku = await generateUniqueSKU();
          isUpdated = true;
        }
      }

      if (isUpdated) {
        await doc.save();
        console.log(`Updated document with ID: ${doc._id}`);
      }
    }

    console.log("SKU migration completed successfully.");
  } catch (error) {
    console.error("Error during SKU migration:", error);
  }
};

// Main function
const main = async () => {
  await addSKUsToExistingDocuments();
};
const updatePackageStatusToVerified = async () => {
  try {
    const documents = await VendorServiceLisitingForm.find();

    for (let doc of documents) {
      let isUpdated = false;

      for (let service of doc.services) {
        if (service.status === true && service.packageStatus !== "Verified") {
          service.packageStatus = "Verified";
          isUpdated = true;
        } else if (service.status === false) {
          service.packageStatus = "Pending";
          isUpdated = true;
        }
      }

      if (isUpdated) {
        await doc.save();
        console.log(`Updated document with ID: ${doc._id}`);
      }
    }

    console.log("Package status update completed successfully.");
  } catch (error) {
    console.error("Error during package status update:", error);
  }
};

const updateStatus = async () => {
  await updatePackageStatusToVerified();
};
// updateStatus()
// main();
//  this function is used for to create sku id for old vendor service which dont have any sku id

export {
  addVenderService,
  getOneVenderService,
  getAllVenderService,
  updateOneVenderService,
  deleteVenderService,
  VerifyService,
  authenticateYouTube,
};

export default processFilesAsync;
