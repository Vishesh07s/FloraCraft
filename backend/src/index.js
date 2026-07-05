import express from "express";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";

// Load routes
import plantsRouter from "./routes/plants.js";
import userAuthRouter from "./routes/userAuth.js";
import cartRouter from "./routes/cart.js";
import ordersRouter from "./routes/orders.js";
import adminRouter from "./routes/admin.js";

dotenv.config();

// Startup Environment Validation (Production Safeguard)
if (process.env.NODE_ENV === "production") {
  const requiredEnv = ["ADMIN_USERNAME", "ADMIN_PASSWORD_HASH", "JWT_SECRET", "FRONTEND_URL", "MONGO_URI"];
  const missing = requiredEnv.filter(variable => !process.env[variable]);

  if (missing.length > 0) {
    console.error("❌ CRITICAL SETUP ERROR: Missing required production environment variables:");
    missing.forEach(variable => console.error(`   - ${variable}`));
    console.error("❌ Server refusing to start in production mode due to security policy.");
    process.exit(1);
  }
} else {
  // Local warning for weak development settings
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "secret123") {
    console.warn("⚠️ SECURITY WARNING: Using default/weak JWT_SECRET in local development.");
  }
}

const app = express();

// Secure HTTP Headers
app.use(helmet());

// Secure CORS configuration
const corsOrigin = process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : true;
app.use(cors({ 
  origin: corsOrigin, 
  credentials: true 
}));

app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/", (_, res) => res.json({ status: "ok", env: process.env.NODE_ENV || "development" }));

// Register routes
app.use("/api/plants", plantsRouter);
app.use("/api/auth", userAuthRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/floracraft_plants";

connectDB(MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});