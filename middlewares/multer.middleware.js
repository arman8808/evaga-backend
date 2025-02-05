import multer from "multer";
import fs from "fs";
import path from "path";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
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
const s3Storage = (folderName) =>
  multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `${folderName}/${Date.now()}-${file.originalname}`);
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
  export const uploadS3 = (folderName, allowedTypes) =>
    multer({
      storage: s3Storage(folderName),
      fileFilter: (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error("Unsupported file type"), false);
        }
      },
    });
