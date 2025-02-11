// import fs from "fs";
// import path from "path";
// import sharp from "sharp";
// import ffmpeg from "fluent-ffmpeg";
// import { Readable } from "stream";
// import { fileURLToPath } from "url";
// import { dirname } from "path";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// const tempDir = path.join(__dirname, "temp");
// if (!fs.existsSync(tempDir)) {
//   fs.mkdirSync(tempDir);
// }

// // Preprocess Image
// const preprocessImage = async (req, file) => {
//   if (!file.buffer) {
//     throw new Error("No buffer provided for image processing.");
//   }
//   return sharp(file.buffer)
//     .resize({ width: 800 })
//     .jpeg({ quality: 80 })
//     .toBuffer();
// };

// // Preprocess Video
// const preprocessVideo = (file, outputPath) =>
//   new Promise((resolve, reject) => {
//     const inputStream = Readable.from(file.buffer);
//     ffmpeg(inputStream)
//       .outputOptions("-preset", "ultrafast")
//       .outputOptions("-crf", "28")
//       .toFormat("mp4")
//       .saveToFile(outputPath)
//       .on("end", () => resolve(fs.readFileSync(outputPath)))
//       .on("error", (err) => reject(err));
//   });

// export const preprocessFiles = async (req, res, next) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return next();
//     }

//     for (const file of req.files) {
//       const ext = path.extname(file.originalname).toLowerCase();
//       const originalSize = file?.buffer?.length || 0;

//       if (originalSize === 0) {
//         console.warn(`File ${file.originalname} has no buffer.`);
//         continue;
//       }
//       console.log(`Original size of ${file.originalname}: ${originalSize} bytes`);

//       if (file.mimetype.startsWith("image/")) {
//         file.buffer = await preprocessImage(req, file);
//         console.log(
//           `Compressed image size of ${file.originalname}: ${file.buffer.length} bytes`
//         );
//       } else if (file.mimetype.startsWith("video/")) {
//         const tempFilePath = path.join(tempDir, `${Date.now()}${ext}`);
//         await preprocessVideo(file, tempFilePath);

//         file.buffer = fs.readFileSync(tempFilePath);
//         console.log(
//           `Compressed video size of ${file.originalname}: ${file.buffer.length} bytes`
//         );
//         fs.unlinkSync(tempFilePath); // Clean up temporary file
//       }
//     }

//     next();
//   } catch (error) {
//     console.error("Error in preprocessing files:", error);
//     next(error);
//   }
// };



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
//   const uploadParams = {
//     Bucket: process.env.S3_BUCKET_NAME,
//     Key: `${folderName}/${Date.now()}-${fileName}`,
//     Body: buffer,
//     ContentType: mimeType,
//   };

//   await s3.send(new PutObjectCommand(uploadParams));
// };

// const preprocessImage = async (file) => {
//   return sharp(file.buffer).resize({ width: 800 }).jpeg({ quality: 80 }).toBuffer();
// };

// const preprocessVideo = (file, outputPath) =>
//   new Promise((resolve, reject) => {
//     const inputStream = Readable.from(file.buffer);
//     ffmpeg(inputStream)
//       .outputOptions("-preset", "ultrafast")
//       .outputOptions("-crf", "28")
//       .toFormat("mp4")
//       .saveToFile(outputPath)
//       .on("end", () => resolve(fs.readFileSync(outputPath)))
//       .on("error", (err) => reject(err));
//   });

// export const preprocessFiles = async (req, res, next) => {
//   try {
//     if (!req.files || req.files.length === 0) return next();

//     for (const file of req.files) {
//       const folderName = "service"; // Folder for S3
//       const ext = path.extname(file.originalname).toLowerCase();

//       if (file.mimetype.startsWith("image/")) {
//         const processedBuffer = await preprocessImage(file);
//         await uploadToS3(folderName, file.originalname, processedBuffer, file.mimetype);
//       } else if (file.mimetype.startsWith("video/")) {
//         const tempFilePath = path.join(tempDir, `${Date.now()}${ext}`);
//         await preprocessVideo(file, tempFilePath);
//         const compressedBuffer = fs.readFileSync(tempFilePath);
//         await uploadToS3(folderName, file.originalname, compressedBuffer, file.mimetype);
//         fs.unlinkSync(tempFilePath);
//       }
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
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const tempDir = path.join(process.cwd(), "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const uploadToS3 = async (folderName, fileName, buffer, mimeType) => {
  const key = `${folderName}/${Date.now()}-${fileName}`;
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  };

  await s3.send(new PutObjectCommand(uploadParams));
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

const preprocessImage = async (file) => {
  return sharp(file.buffer).resize({ width: 800 }).jpeg({ quality: 80 }).toBuffer();
};


  const preprocessVideo = (file, outputPath) =>
    new Promise((resolve, reject) => {
      const inputStream = Readable.from(file.buffer);
      ffmpeg(inputStream)
        .videoCodec("libx264") // Use H.264 for better compression
        .outputOptions("-preset veryfast") // Faster compression
        .outputOptions("-crf 30") // Lower CRF = Higher compression (Try 28-32)
        .outputOptions("-b:v 1M") // Set max bitrate to 1Mbps
        .outputOptions("-movflags +faststart") // Optimize for streaming
        .toFormat("mp4")
        .save(outputPath)
        .on("end", () => {
          resolve(fs.readFileSync(outputPath));
        })
        .on("error", (err) => reject(err));
    });
  
export const preprocessFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) return next();

    for (const file of req.files) {
      const folderName = "service"; // Folder for S3
      const ext = path.extname(file.originalname).toLowerCase();

      if (file.mimetype.startsWith("image/")) {
        const processedBuffer = await preprocessImage(file);
        file.s3Location = await uploadToS3(folderName, file.originalname, processedBuffer, file.mimetype);
      } else if (file.mimetype.startsWith("video/")) {
        const tempFilePath = path.join(tempDir, `${Date.now()}${ext}`);
        await preprocessVideo(file, tempFilePath);
        const compressedBuffer = fs.readFileSync(tempFilePath);
        file.s3Location = await uploadToS3(folderName, file.originalname, compressedBuffer, file.mimetype);
        fs.unlinkSync(tempFilePath);
      }
    }

    next();
  } catch (error) {
    console.error("Error in preprocessing files:", error);
    next(error);
  }
};
