import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
dotenv.config();
const s3 = new S3Client({ region: process.env.AWS_REGION });

const getMimeType = (key) => {
  const ext = key.split(".").pop();
  const mimeTypes = {
    mp4: "video/mp4",
    jpg: "image/jpg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    ogg: "video/ogg",
    mov: "video/mov",
    webm: "video/webm",
  };
  return mimeTypes[ext] || "application/octet-stream";
};
export const getPreSignedUrl = async (key) => {
  if (Array.isArray(key)) {
    key = key[0];
  }

  const mimeType = getMimeType(key);
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ResponseContentType: mimeType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return url;
};

// export const getPreSignedUrl = async (key) => {
//   console.log(key);

//   const mimeType = getMimeType(key);
//   const command = new GetObjectCommand({
//     Bucket: process.env.S3_BUCKET_NAME,
//     Key: key,
//     ResponseContentType: mimeType,
//   });

//   const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
//   return url;
// };
