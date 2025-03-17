import multer from "multer";
import fs from "fs";
import path from "path";
import multerS3 from "multer-s3";
import {
  S3Client,
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

const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(path.resolve(dir))) {
    fs.mkdirSync(path.resolve(dir), { recursive: true });
  }
};
const storage = (folderName) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join("public", folderName);
      createDirIfNotExists(uploadDir);
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const date = new Date();
      const dateString = `${date.getFullYear()}${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}_${date
        .getHours()
        .toString()
        .padStart(2, "0")}${date.getMinutes().toString().padStart(2, "0")}${date
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
      const uniqueName = `${dateString}-${file.originalname}`;
      cb(null, uniqueName);
    },
  });
// Multer S3 Storage (AWS S3)
// const s3Storage = (folderName) =>
//   multerS3({
//     s3: s3,
//     bucket: process.env.S3_BUCKET_NAME,
//     metadata: (req, file, cb) => {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: (req, file, cb) => {
//       cb(null, `${folderName}/${Date.now()}-${file.originalname}`);
//     },
//   });

// S3 Storage with Sharp and FFmpeg
// const s3Storage = (folderName) =>
//   multerS3({
//     s3: s3,
//     bucket: process.env.S3_BUCKET_NAME,
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     key: async (req, file, cb) => {
//       try {
//         const fileExtension = path.extname(file.originalname).toLowerCase();
//         const filePath = `${folderName}/${Date.now()}-${file.originalname}`;

//         if (file.mimetype.startsWith("image/")) {
//           // Compress image
//           const compressedImage = await processImage(file.buffer);
//           cb(null, filePath, compressedImage);
//         } else if (file.mimetype.startsWith("video/")) {
//           // Compress video
//           const compressedVideo = await processVideo(file.buffer, filePath);
//           cb(null, compressedVideo);
//         } else {
//           cb(new Error("Unsupported file type"), null);
//         }
//       } catch (err) {
//         cb(err, null);
//       }
//     },
//   });

const s3Storage = (folderName) =>
  multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const uniqueName = `${folderName}/${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  });

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error("Unsupported file type");
    error.status = 400;
    cb(error, false);
  }
};
export const upload = (folderName, allowedTypes) =>
  multer({
    storage: storage(folderName),

    fileFilter: fileFilter(allowedTypes),
  });
// export const uploadS3 = (folderName, allowedTypes) =>
//   multer({
//     storage: s3Storage(folderName),
//     fileFilter: (req, file, cb) => {
//       if (allowedTypes.includes(file.mimetype)) {
//         cb(null, true);
//       } else {
//         cb(new Error("Unsupported file type"), false);
//       }
//     },
//   });

// export const uploadS3 = (folderName, allowedTypes) =>
//   multer({
//     storage: s3Storage(folderName),
//     fileFilter: fileFilter(allowedTypes),
//   });
// export const uploadS3 = (folderName, allowedTypes) =>
//   multer({
//     storage: s3Storage(folderName),
//     fileFilter: (req, file, cb) => {
//       if (allowedTypes.includes(file.mimetype)) {
//         cb(null, true);
//       } else {
//         cb(new Error("Unsupported file type"), false);
//       }
//     },
//   });
export const uploadS3 = (folderName, allowedTypes) =>
  multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Unsupported file type"), false);
      }
    },
  });
// export const uploadAndMoveS3 = (folderName, allowedTypes) => {
//   const upload = multer({
//     storage: multer.memoryStorage(),
//     fileFilter: (req, file, cb) => {
//       if (allowedTypes.includes(file.mimetype)) {
//         cb(null, true);
//       } else {
//         cb(new Error("Unsupported file type"), false);
//       }
//     },
//   }).any();

//   return async (req, res, next) => {
//     upload(req, res, async (err) => {
//       if (err) {
//         return res.status(400).json({ error: err.message });
//       }

//       const privateBucket = process.env.PRIVATE_BUCKET_NAME;
//       const publicBucket = process.env.PUBLIC_BUCKET_NAME;

//       try {
//         if (!req.files || req.files.length === 0) {
//           return res.status(400).json({ error: "No files uploaded" });
//         }

//         console.log("Files in uploadAndMoveS3:", req.files.map(f => f.originalname));

//         for (const file of req.files) {
//           if (!file.processedBuffer) {
//             console.warn(`Processed buffer missing for file: ${file.originalname}`);
//             continue; // Skip files without a compressed version
//           }

//           const dateString = Date.now().toString(); // Unique timestamp
//           const uniqueName = `${dateString}-${file.originalname}`;
//           const privateKey = `${folderName}/${uniqueName}`;
//           const publicKey = `${folderName}/${uniqueName}`;

//           try {
//             // Upload compressed file to private bucket
//             await s3.send(
//               new PutObjectCommand({
//                 Bucket: privateBucket,
//                 Key: privateKey,
//                 Body: file.processedBuffer, // Ensure using processed buffer
//                 ContentType: file.mimetype,
//               })
//             );
//             console.log(`Uploaded to private bucket: ${privateKey}`);

//             // Copy from private to public bucket
//             await s3.send(
//               new CopyObjectCommand({
//                 CopySource: `${privateBucket}/${privateKey}`,
//                 Bucket: publicBucket,
//                 Key: publicKey,
//               })
//             );
//             console.log(`Copied to public bucket: ${publicKey}`);

//             // Delete from private bucket
//             await s3.send(
//               new DeleteObjectCommand({
//                 Bucket: privateBucket,
//                 Key: privateKey,
//               })
//             );
//             console.log(`Deleted from private bucket: ${privateKey}`);
//           } catch (innerError) {
//             console.error(`Error processing file ${uniqueName}:`, innerError);
//             throw innerError;
//           }
//         }

//         next();
//       } catch (outerError) {
//         console.error("Error moving files:", outerError);
//         return res.status(500).json({ error: "Error processing files" });
//       }
//     });
//   };
// };

// export const uploadAndMoveS3 = (folderName, allowedTypes) => {
//   const upload = multer({
//     storage: multer.memoryStorage(),
//     fileFilter: (req, file, cb) => {
//       if (allowedTypes.includes(file.mimetype)) {
//         cb(null, true);
//       } else {
//         const error = new Error(`Unsupported file type: ${file.mimetype}`);
//         cb(error, false);
//       }
//     },
//   }).any();

//   return async (req, res, next) => {
//     upload(req, res, async (err) => {
//       if (err) {
//         return res.status(400).json({ error: err.message });
//       }

//       const privateBucket = process.env.PRIVATE_BUCKET_NAME;

//       try {
//         for (const file of req.files) {
//           const uniqueName = `${Date.now()}-${file.originalname}`;
//           const privateKey = `${folderName}/${uniqueName}`;

//           try {
//             // Upload original file to private bucket
//             await s3.send(
//               new PutObjectCommand({
//                 Bucket: privateBucket,
//                 Key: privateKey,
//                 Body: file.buffer, // add streaming
//                 ContentType: file.mimetype,
//               })
//             );

//             console.log(`Uploaded original to private bucket: ${privateKey}`);

//             // Attach S3 location to file object for later processing
//             file.s3Key = privateKey;
//           } catch (innerError) {
//             console.error(`Error uploading ${uniqueName}:`, innerError);
//             throw innerError;
//           }
//         }

//         next();
//       } catch (outerError) {
//         console.error("Error uploading files:", outerError);
//         return res.status(500).json({ error: "Error processing files" });
//       }
//     });
//   };
// };
export const uploadAndMoveS3 = (folderName, allowedTypes) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        const error = new Error(`Unsupported file type: ${file.mimetype}`);
        cb(error, false);
      }
    },
  }).any();

  return async (req, res, next) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};