import multer from "multer";
import fs from "fs";
import path from "path";
import multerS3 from "multer-s3";
import {Readable, PassThrough } from 'stream';
import sharp from 'sharp';
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
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

export const upload = (folderName, allowedTypes) =>
  multer({
    storage: storage(folderName),

    fileFilter: fileFilter(allowedTypes),
  });

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
//       next();
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
        cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
      }
    },
  }).any();

  return async (req, res, next) => {
    upload(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });

      if (req.files) {
        await Promise.all(req.files.map(async (file) => {
          if (file.mimetype.startsWith('image/')) {
            try {
              // Create streams
              file.optimizedStream = new PassThrough();
              file.thumbnailStream = new PassThrough();

              // Create sharp transformers
              const optimizer = sharp()
                .resize({ width: 1920, withoutEnlargement: true })
                .webp({ quality: 80 });

              const thumbnailer = sharp()
                .resize(300, 375)
                .webp({ quality: 70 });

              // Pipe buffers through transformers
              Readable.from(file.buffer).pipe(optimizer).pipe(file.optimizedStream);
              Readable.from(file.buffer).pipe(thumbnailer).pipe(file.thumbnailStream);

            } catch (error) {
              console.error('Image optimization failed:', error);
              // Fallback to original buffer as stream
              file.optimizedStream = Readable.from(file.buffer);
              file.thumbnailStream = null;
            }
          } else {
            // For non-images, create stream directly
            file.stream = Readable.from(file.buffer);
          }
        }));
      }

      next();
    });
  };
};

export const uploadToS3 = (folderName, allowedTypes) =>
  multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.PUBLIC_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const fileName = `${folderName}/${Date.now()}_${file.originalname}`;
        cb(null, fileName);
      },
    }),
    fileFilter: fileFilter(allowedTypes),
  });
