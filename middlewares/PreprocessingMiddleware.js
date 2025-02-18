// // import fs from "fs";
// // import path from "path";
// // import sharp from "sharp";
// // import ffmpeg from "fluent-ffmpeg";
// // import { Readable } from "stream";
// // import { fileURLToPath } from "url";
// // import { dirname } from "path";
// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = dirname(__filename);
// // const tempDir = path.join(__dirname, "temp");
// // if (!fs.existsSync(tempDir)) {
// //   fs.mkdirSync(tempDir);
// // }

// // // Preprocess Image
// // const preprocessImage = async (req, file) => {
// //   if (!file.buffer) {
// //     throw new Error("No buffer provided for image processing.");
// //   }
// //   return sharp(file.buffer)
// //     .resize({ width: 800 })
// //     .jpeg({ quality: 80 })
// //     .toBuffer();
// // };

// // // Preprocess Video
// // const preprocessVideo = (file, outputPath) =>
// //   new Promise((resolve, reject) => {
// //     const inputStream = Readable.from(file.buffer);
// //     ffmpeg(inputStream)
// //       .outputOptions("-preset", "ultrafast")
// //       .outputOptions("-crf", "28")
// //       .toFormat("mp4")
// //       .saveToFile(outputPath)
// //       .on("end", () => resolve(fs.readFileSync(outputPath)))
// //       .on("error", (err) => reject(err));
// //   });

// // export const preprocessFiles = async (req, res, next) => {
// //   try {
// //     if (!req.files || req.files.length === 0) {
// //       return next();
// //     }

// //     for (const file of req.files) {
// //       const ext = path.extname(file.originalname).toLowerCase();
// //       const originalSize = file?.buffer?.length || 0;

// //       if (originalSize === 0) {
// //         console.warn(`File ${file.originalname} has no buffer.`);
// //         continue;
// //       }
// //       console.log(`Original size of ${file.originalname}: ${originalSize} bytes`);

// //       if (file.mimetype.startsWith("image/")) {
// //         file.buffer = await preprocessImage(req, file);
// //         console.log(
// //           `Compressed image size of ${file.originalname}: ${file.buffer.length} bytes`
// //         );
// //       } else if (file.mimetype.startsWith("video/")) {
// //         const tempFilePath = path.join(tempDir, `${Date.now()}${ext}`);
// //         await preprocessVideo(file, tempFilePath);

// //         file.buffer = fs.readFileSync(tempFilePath);
// //         console.log(
// //           `Compressed video size of ${file.originalname}: ${file.buffer.length} bytes`
// //         );
// //         fs.unlinkSync(tempFilePath); // Clean up temporary file
// //       }
// //     }

// //     next();
// //   } catch (error) {
// //     console.error("Error in preprocessing files:", error);
// //     next(error);
// //   }
// // };

// // import fs from "fs";
// // import path from "path";
// // import sharp from "sharp";
// // import ffmpeg from "fluent-ffmpeg";
// // import { Readable } from "stream";
// // import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// // const s3 = new S3Client({
// //   region: process.env.AWS_REGION,
// //   credentials: {
// //     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
// //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// //   },
// // });

// // const tempDir = path.join(process.cwd(), "temp");
// // if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// // const uploadToS3 = async (folderName, fileName, buffer, mimeType) => {
// //   const uploadParams = {
// //     Bucket: process.env.S3_BUCKET_NAME,
// //     Key: `${folderName}/${Date.now()}-${fileName}`,
// //     Body: buffer,
// //     ContentType: mimeType,
// //   };

// //   await s3.send(new PutObjectCommand(uploadParams));
// // };

// // const preprocessImage = async (file) => {
// //   return sharp(file.buffer).resize({ width: 800 }).jpeg({ quality: 80 }).toBuffer();
// // };

// // const preprocessVideo = (file, outputPath) =>
// //   new Promise((resolve, reject) => {
// //     const inputStream = Readable.from(file.buffer);
// //     ffmpeg(inputStream)
// //       .outputOptions("-preset", "ultrafast")
// //       .outputOptions("-crf", "28")
// //       .toFormat("mp4")
// //       .saveToFile(outputPath)
// //       .on("end", () => resolve(fs.readFileSync(outputPath)))
// //       .on("error", (err) => reject(err));
// //   });

// // export const preprocessFiles = async (req, res, next) => {
// //   try {
// //     if (!req.files || req.files.length === 0) return next();

// //     for (const file of req.files) {
// //       const folderName = "service"; // Folder for S3
// //       const ext = path.extname(file.originalname).toLowerCase();

// //       if (file.mimetype.startsWith("image/")) {
// //         const processedBuffer = await preprocessImage(file);
// //         await uploadToS3(folderName, file.originalname, processedBuffer, file.mimetype);
// //       } else if (file.mimetype.startsWith("video/")) {
// //         const tempFilePath = path.join(tempDir, `${Date.now()}${ext}`);
// //         await preprocessVideo(file, tempFilePath);
// //         const compressedBuffer = fs.readFileSync(tempFilePath);
// //         await uploadToS3(folderName, file.originalname, compressedBuffer, file.mimetype);
// //         fs.unlinkSync(tempFilePath);
// //       }
// //     }

// //     next();
// //   } catch (error) {
// //     console.error("Error in preprocessing files:", error);
// //     next(error);
// //   }
// // };
// import fs from "fs";
// import path from "path";
// import sharp from "sharp";
// import ffmpeg from "fluent-ffmpeg";
// import { Readable } from "stream";
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const tempDir = path.join(process.cwd(), "temp");
// if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// const uploadToS3 = async (folderName, fileName, buffer, mimeType) => {
//   const key = `${folderName}/${Date.now()}-${fileName}`;
//   const uploadParams = {
//     Bucket: process.env.S3_BUCKET_NAME,
//     Key: key,
//     Body: buffer,
//     ContentType: mimeType,
//   };

//   await s3.send(new PutObjectCommand(uploadParams));
//   return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
// };

// const preprocessImage = async (file) => {
//   return sharp(file.buffer).resize({ width: 800 }).jpeg({ quality: 80 }).toBuffer();
// };

//   const preprocessVideo = (file, outputPath) =>
//     new Promise((resolve, reject) => {
//       const inputStream = Readable.from(file.buffer);
//       ffmpeg(inputStream)
//         .videoCodec("libx264") // Use H.264 for better compression
//         .outputOptions("-preset veryfast") // Faster compression
//         .outputOptions("-crf 30") // Lower CRF = Higher compression (Try 28-32)
//         .outputOptions("-b:v 1M") // Set max bitrate to 1Mbps
//         .outputOptions("-movflags +faststart") // Optimize for streaming
//         .toFormat("mp4")
//         .save(outputPath)
//         .on("end", () => {
//           resolve(fs.readFileSync(outputPath));
//         })
//         .on("error", (err) => reject(err));
//     });

// // export const preprocessFiles = async (req, res, next) => {
// //   try {
// //     if (!req.files || req.files.length === 0) return next();

// //     for (const file of req.files) {
// //       const folderName = "service"; // Folder for S3
// //       const ext = path.extname(file.originalname).toLowerCase();

// //       if (file.mimetype.startsWith("image/")) {
// //         const processedBuffer = await preprocessImage(file);
// //         file.s3Location = await uploadToS3(folderName, file.originalname, processedBuffer, file.mimetype);
// //       } else if (file.mimetype.startsWith("video/")) {
// //         const tempFilePath = path.join(tempDir, `${Date.now()}${ext}`);
// //         await preprocessVideo(file, tempFilePath);
// //         const compressedBuffer = fs.readFileSync(tempFilePath);
// //         file.s3Location = await uploadToS3(folderName, file.originalname, compressedBuffer, file.mimetype);
// //         fs.unlinkSync(tempFilePath);
// //       }
// //     }

// //     next();
// //   } catch (error) {
// //     console.error("Error in preprocessing files:", error);
// //     next(error);
// //   }
// // };

// export const preprocessFiles = async (req, res, next) => {
//   try {
//     if (!req.files || req.files.length === 0) return next();

//     console.log("Preprocessing files..."); // Log to verify middleware execution
//     for (const file of req.files) {
//       const folderName = "service"; // Folder for S3
//       const ext = path.extname(file.originalname).toLowerCase();

//       if (file.mimetype.startsWith("image/")) {
//         const processedBuffer = await preprocessImage(file);
//         file.processedBuffer = processedBuffer; // Store compressed buffer
//         file.s3Location = await uploadToS3(folderName, file.originalname, processedBuffer, file.mimetype);
//       } else if (file.mimetype.startsWith("video/")) {
//         const tempFilePath = path.join(tempDir, `${Date.now()}${ext}`);
//         await preprocessVideo(file, tempFilePath);
//         const compressedBuffer = fs.readFileSync(tempFilePath);

//         file.processedBuffer = compressedBuffer; // Store compressed buffer
//         file.s3Location = await uploadToS3(folderName, file.originalname, compressedBuffer, file.mimetype);

//         fs.unlinkSync(tempFilePath); // Clean up temp file
//       }
//       console.log(`Processed buffer set for: ${file.originalname}`);
//     }

//     next();
//   } catch (error) {
//     console.error("Error in preprocessing files:", error);
//     next(error);
//   }
// };

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
    // .resize({
    //   width: 800,
    //   height: 1000,
    //   fit: "contain", 
    //   position: "center", 
    // })
    .modulate({
      brightness: 1.1, 
      contrast: 1.2, 
    })
    .jpeg({ quality: 90 }) 
    .toBuffer();
};

// Process Video
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
//       const compressedKey = `service/compressed-${Date.now()}-${file.originalname}`;

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
//       await uploadToS3(privateBucket, compressedKey, compressedBuffer, file.mimetype);
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

//       // Delete original file from private bucket
//       await s3.send(
//         new DeleteObjectCommand({
//           Bucket: privateBucket,
//           Key: file.s3Key,
//         })
//       );
//       console.log(`Deleted from private bucket: ${file.s3Key}`);

//       // **Set s3Location to the public bucket URL**
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

    const privateBucket = process.env.PRIVATE_BUCKET_NAME;
    const publicBucket = process.env.PUBLIC_BUCKET_NAME;

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const compressedKey = `service/compressed-${Date.now()}-${
        file.originalname
      }`;

      if (!file.s3Key) {
        console.warn(`No S3 key for file: ${file.originalname}`);
        continue;
      }

      console.log(`Processing: ${file.s3Key}`);

      // Download original file
      const originalBuffer = await downloadFromS3(privateBucket, file.s3Key);

      let compressedBuffer;
      if (file.mimetype.startsWith("image/")) {
        compressedBuffer = await preprocessImage(originalBuffer);
      } else if (file.mimetype.startsWith("video/")) {
        const tempFilePath = path.join(tempDir, `${Date.now()}${ext}`);
        compressedBuffer = await preprocessVideo(originalBuffer, tempFilePath);
        fs.unlinkSync(tempFilePath);
      }

      // Upload compressed file to private bucket
      await uploadToS3(
        privateBucket,
        compressedKey,
        compressedBuffer,
        file.mimetype
      );
      console.log(`Compressed uploaded to private bucket: ${compressedKey}`);

      // Copy compressed file to public bucket
      await s3.send(
        new CopyObjectCommand({
          CopySource: `${privateBucket}/${compressedKey}`,
          Bucket: publicBucket,
          Key: compressedKey,
        })
      );
      console.log(`Copied to public bucket: ${compressedKey}`);

      // ✅ Delete original file from private bucket
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: privateBucket,
            Key: file.s3Key, // Original file
          })
        );
        console.log(`Deleted original file from private bucket: ${file.s3Key}`);
      } catch (deleteError) {
        console.warn(
          `Failed to delete original file: ${file.s3Key}`,
          deleteError
        );
      }

      // ✅ Delete compressed file from private bucket after copying to public
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: privateBucket,
            Key: compressedKey, // Compressed file
          })
        );
        console.log(
          `Deleted compressed file from private bucket: ${compressedKey}`
        );
      } catch (deleteError) {
        console.warn(
          `Failed to delete compressed file: ${compressedKey}`,
          deleteError
        );
      }

      // ✅ Store public URL for the compressed file
      file.s3Location = `https://${publicBucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${compressedKey}`;
    }

    next();
  } catch (error) {
    console.error("Error processing files:", error);
    return res.status(500).json({ error: "Error processing files" });
  }
};
