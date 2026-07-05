import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const userAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Malformed authorization token" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "floracraft_jwt_secret_token_key_development_only_123";

    // Explicitly check signature using HS256 algorithm
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });

    if (decoded.role !== "user") {
      return res.status(403).json({ error: "Access denied. Customers only." });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token has expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};
