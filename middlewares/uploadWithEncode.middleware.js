import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const processImagePreview = async (req, res, next) => {
  if (!req.file || !req.file.buffer) {
    console.error("File buffer is missing.");
    req.file = req.file || {};
    req.file.preview = null;
    return next();
  }

  const folder = req._s3Folder || "uploads";
  const timestamp = Date.now();
  const cleanName = req.file.originalname.replace(/\s+/g, "_");
  const originalKey = `${folder}/${timestamp}_${cleanName}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.PUBLIC_BUCKET_NAME,
        Key: originalKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );
    req.file.key = originalKey;
    req.file.location = `${originalKey}`;

    const previewBuffer = await sharp(req.file.buffer)
      .resize(100, 100, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
    req.file.preview = `data:image/jpeg;base64,${previewBuffer.toString(
      "base64"
    )}`;

    next();
  } catch (err) {
    console.error("Error in processImagePreview:", err);
    return res
      .status(500)
      .json({ error: "Error uploading or processing image" });
  }
};

// New middleware for processing multiple files (for custom events)
export const processMultipleImagePreviews = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    console.log("No files to process.");
    req.files = [];
    return next();
  }

  const folder = req._s3Folder || "uploads";
  const timestamp = Date.now();

  try {
    // Process all files in parallel
    const processedFiles = await Promise.all(
      req.files.map(async (file) => {
        if (!file.buffer) {
          console.error("File buffer is missing for file:", file.originalname);
          return { ...file, preview: null, location: null, key: null };
        }

        const cleanName = file.originalname.replace(/\s+/g, "_");
        const originalKey = `${folder}/${timestamp}_${cleanName}`;

        // Upload to S3
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.PUBLIC_BUCKET_NAME,
            Key: originalKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );

        // Generate preview
        const previewBuffer = await sharp(file.buffer)
          .resize(100, 100, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();

        return {
          ...file,
          key: originalKey,
          location: originalKey,
          preview: `data:image/jpeg;base64,${previewBuffer.toString("base64")}`
        };
      })
    );

    req.files = processedFiles;
    next();
  } catch (err) {
    console.error("Error in processMultipleImagePreviews:", err);
    return res
      .status(500)
      .json({ error: "Error uploading or processing images" });
  }
};

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported file type"), false);
};

// Only pulls the file into memory (so we have `req.file.buffer`)
export const uploadToS3WithEncoded = (folderName, allowedTypes) => {
  // stash the folder name for the next middleware
  return (req, res, next) => {
    req._s3Folder = folderName;
    multer({
      storage: multer.memoryStorage(),
      fileFilter: fileFilter(allowedTypes),
    }).single("bannerImage")(req, res, next);
  };
};

// New middleware for handling multiple files with custom field names (for custom events)
export const uploadMultipleToS3WithEncoded = (folderName, allowedTypes) => {
  return (req, res, next) => {
    req._s3Folder = folderName;
    multer({
      storage: multer.memoryStorage(),
      fileFilter: fileFilter(allowedTypes),
    }).any()(req, res, next);
  };
};