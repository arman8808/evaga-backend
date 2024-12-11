import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route.js";
import venderRoutes from "./routes/vender.routes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import formRoute from "./routes/form.routes.js";
import menuRoute from "./routes/menu.routes.js";
import bannerRoutes from "./routes/banner.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminActionRoutes from "./routes/adminAction.routes.js";
import createNewService from "./routes/vender.service.list.routes.js";
const app = express();
// app.use(
//   cors({
//     origin: "http://localhost:3000,http://localhost:8001",
//     credentials: true,
//   })
// );
const allowedOrigins = ["http://localhost:3000", "http://localhost:8001"];
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
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/vender", venderRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/adminAction", adminActionRoutes);
app.use("/api/v1/vender/createService", createNewService);
app.use("/api/v1", categoryRoutes);
app.use("/api/v1/form", formRoute);
app.use("/api/v1/menu", menuRoute);
app.use("/api/v1/banner", bannerRoutes);

app.get("/", async (req, res) => {
  res.status(200).json("Server Is Live");
});

export { app };
