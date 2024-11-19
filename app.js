import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route.js";
import venderRoutes from "./routes/vender.routes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import formRoute from "./routes/form.routes.js";
import menuRoute from "./routes/menu.routes.js";
import createNewService from "./routes/vender.service.list.routes.js";
const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use("/images", express.static("public"));
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/vender", venderRoutes);
app.use("/api/v1/vender/createService", createNewService);
app.use("/api/v1", categoryRoutes);
app.use("/api/v1/form", formRoute);
app.use("/api/v1/menu", menuRoute);

app.get("/", async (req, res) => {
  res.status(200).json("Server Is Live");
});

export { app };
