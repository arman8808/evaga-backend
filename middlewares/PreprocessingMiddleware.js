import fs from "fs";
import path from "path";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const tempDir = path.join(process.cwd(), "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// Download file from S3
const downloadFromS3 = async (bucket, key) => {
  const { Body } = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );
  return Buffer.from(await Body.transformToByteArray());
};

// Upload file to S3
const uploadToS3 = async (bucket, key, buffer, mimeType) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
};

// Process Image
const preprocessImage = async (buffer) => {
  return sharp(buffer)
    .modulate({
      brightness: 1.1, 
      contrast: 1.2, 
    })
    .jpeg({ quality: 90 }) 
    .toBuffer();
};


const preprocessVideo = (buffer, outputPath) =>
  new Promise((resolve, reject) => {
    const inputStream = Readable.from(buffer);
    ffmpeg(inputStream)
      .videoCodec("libx264")
      .outputOptions("-preset veryfast") 
      .outputOptions("-crf 30") 
      .outputOptions("-b:v 1M")
      .outputOptions("-movflags +faststart") 
      .toFormat("mp4")
      .save(outputPath)
      .on("end", () => resolve(fs.readFileSync(outputPath)))
      .on("error", (err) => reject(err));
  });



// export const processAndTransferFiles = async (req, res, next) => {
//   try {
//     if (!req.files || req.files.length === 0) return next();

//     const privateBucket = process.env.PRIVATE_BUCKET_NAME;
//     const publicBucket = process.env.PUBLIC_BUCKET_NAME;

//     for (const file of req.files) {
//       const ext = path.extname(file.originalname).toLowerCase();
//       const compressedKey = `service/compressed-${Date.now()}-${
//         file.originalname
//       }`;

//       if (!file.s3Key) {
//         console.warn(`No S3 key for file: ${file.originalname}`);
//         continue;
//       }

//       console.log(`Processing: ${file.s3Key}`);

//       // Download original file
//       const originalBuffer = await downloadFromS3(privateBucket, file.s3Key);

//       let compressedBuffer;
//       if (file.mimetype.startsWith("image/")) {
//         compressedBuffer = await preprocessImage(originalBuffer);
//       } else if (file.mimetype.startsWith("video/")) {
//         const tempFilePath = path.join(tempDir, `${Date.now()}${ext}`);
//         compressedBuffer = await preprocessVideo(originalBuffer, tempFilePath);
//         fs.unlinkSync(tempFilePath);
//       }

//       // Upload compressed file to private bucket
//       await uploadToS3(
//         privateBucket,
//         compressedKey,
//         compressedBuffer,
//         file.mimetype
//       );
//       console.log(`Compressed uploaded to private bucket: ${compressedKey}`);

//       // Copy compressed file to public bucket
//       await s3.send(
//         new CopyObjectCommand({
//           CopySource: `${privateBucket}/${compressedKey}`,
//           Bucket: publicBucket,
//           Key: compressedKey,
//         })
//       );
//       console.log(`Copied to public bucket: ${compressedKey}`);

//       // ✅ Delete original file from private bucket
//       try {
//         await s3.send(
//           new DeleteObjectCommand({
//             Bucket: privateBucket,
//             Key: file.s3Key, // Original file
//           })
//         );
//         console.log(`Deleted original file from private bucket: ${file.s3Key}`);
//       } catch (deleteError) {
//         console.warn(
//           `Failed to delete original file: ${file.s3Key}`,
//           deleteError
//         );
//       }

//       // ✅ Delete compressed file from private bucket after copying to public
//       try {
//         await s3.send(
//           new DeleteObjectCommand({
//             Bucket: privateBucket,
//             Key: compressedKey, // Compressed file
//           })
//         );
//         console.log(
//           `Deleted compressed file from private bucket: ${compressedKey}`
//         );
//       } catch (deleteError) {
//         console.warn(
//           `Failed to delete compressed file: ${compressedKey}`,
//           deleteError
//         );
//       }

//       // ✅ Store public URL for the compressed file
//       file.s3Location = `https://${publicBucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${compressedKey}`;
//     }

//     next();
//   } catch (error) {
//     console.error("Error processing files:", error);
//     return res.status(500).json({ error: "Error processing files" });
//   }
// };


export const processAndTransferFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) return next();

    for (const file of req.files) {
      // Attach metadata to the file object for later processing
      file.uniqueName = `${Date.now()}-${file.originalname}`;
      file.privateKey = `service/${file.uniqueName}`;
    }

    next();
  } catch (error) {
    console.error("Error preparing files:", error);
    return res.status(500).json({ error: "Error preparing files" });
  }
};