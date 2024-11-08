import multer from "multer";
import fs from "fs";
import path from "path";

const tempDir = "./public/images";

if (!fs.existsSync(path.resolve(tempDir))) {
  fs.mkdirSync(path.resolve(tempDir), { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
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
    const extension = path.extname(file.originalname);
    const uniqueName = `${dateString}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const dynamicFileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};
const createMulterUpload = (allowedTypes) =>
  multer({ storage, fileFilter: dynamicFileFilter(allowedTypes) });
export { createMulterUpload };
export const upload = multer({
  storage,
});
