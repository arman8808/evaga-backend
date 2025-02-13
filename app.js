import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route.js";
import venderRoutes from "./routes/vender.routes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import formRoute from "./routes/form.routes.js";
import menuRoute from "./routes/menu.routes.js";
import bannerRoutes from "./routes/banner.routes.js";
import packagesRoute from "./routes/package.routes.js";
import wishlist from "./routes/wishlist.routes.js";
import coupons from "./routes/coupons.routes.js";
import categoryFee from "./routes/categoryFee.routes.js";
import cart from "./routes/cart.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminActionRoutes from "./routes/adminAction.routes.js";
import createNewService from "./routes/vender.service.list.routes.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

// app.use(
//   cors({
//     origin: "http://localhost:3000,http://localhost:8001",
//     credentials: true,
//   })
// );
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8001",
  "https://main.d33v12li0wdsv4.amplifyapp.com", 
  "https://13.53.219.16",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use("/images", express.static("public"));
app.get("/video/stream/*", (req, res) => {
  const decodedPath = decodeURIComponent(req.params[0]);
  const filePath = path.join(__dirname, "public", decodedPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).send("File not found");
    }

    const fileSize = stats.size;
    const range = req.headers.range;

    if (range) {
      const [start, end] = range
        .replace(/bytes=/, "")
        .split("-")
        .map(Number);

      const chunkStart = start || 0;
      const chunkEnd = end || fileSize - 1;

      const contentLength = chunkEnd - chunkStart + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${chunkStart}-${chunkEnd}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
      });

      const stream = fs.createReadStream(filePath, { start: chunkStart, end: chunkEnd });
      stream.pipe(res);
    } else {

      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      });

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  });
});




app.use("/api/v1/user", userRoutes);
app.use("/api/v1/vender", venderRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/adminAction", adminActionRoutes);
app.use("/api/v1/vender/createService", createNewService);
app.use("/api/v1", categoryRoutes);
app.use("/api/v1/form", formRoute);
app.use("/api/v1/menu", menuRoute);
app.use("/api/v1/banner", bannerRoutes);
app.use("/api/v1/packages", packagesRoute);
app.use("/api/v1/wishlist", wishlist);
app.use("/api/v1/coupons", coupons);
app.use("/api/v1/categoryFee", categoryFee);
app.use("/api/v1/cart", cart);

app.get("/", async (req, res) => {
  res.status(200).json("Server Is Live");
});

export { app };
