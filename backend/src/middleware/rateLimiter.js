import rateLimit from "express-rate-limit";

// Rate limiter for authentication endpoints: 5 attempts per 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, 
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter for other endpoints to protect database operations
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: { error: "Too many requests from this IP. Please try again later." },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
});
