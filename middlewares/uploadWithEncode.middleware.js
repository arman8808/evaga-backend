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
    // 1️⃣ Upload ORIGINAL to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.PUBLIC_BUCKET_NAME,
        Key: originalKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );
    req.file.key = originalKey; // for your controller’s BannerUrl
    req.file.location = `${originalKey}`;
console.log(originalKey);

    // 2️⃣ Generate in-memory PREVIEW (no S3 upload)
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
