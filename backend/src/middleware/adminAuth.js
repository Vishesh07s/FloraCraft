import jwt from "jsonwebtoken";

export const adminAuth = (req, res, next) => {
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

    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token has expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};
