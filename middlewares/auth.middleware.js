import jwt from "jsonwebtoken";
import User from "../models/user.modal.js";
import Admin from "../models/admin.modal.js";
import Vender from "../models/vender.modal.js";

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET;

const verifyJwt = (allowedRoles) => {
  return async (req, res, next) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorized request" });
    }

    try {
      const decodedToken = jwt.verify(token, JWT_SECRET);
      const { role, _id } = decodedToken;
      let user;

      if (role === "admin") {
        user = await Admin.findById(_id).select("-password -refreshToken");
      } else if (role === "vendor") {
        user = await Vender.findById(_id).select("-password -refreshToken");
      } else if (role === "user") {
        user = await User.findById(_id).select("-password -refreshToken");
      } else {
        return res.status(403).json({ error: "Invalid role in token" });
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          error:
            "Access denied. You are not authorized to access this resource. Please verify your credentials or contact support for assistance.",
        });
      }


      req.user = user;
      req.user.role = role;

      next();
    } catch (error) {
      console.error("JWT verification error:", error);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
};

export default verifyJwt;
