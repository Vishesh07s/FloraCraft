import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { User } from "../models/User.js";
import { userAuth } from "../middleware/userAuth.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { Plant } from "../models/Plant.js";

const router = Router();

// Centralized validation handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ----------------------------------------------------
// AUTHENTICATION ENDPOINTS
// ----------------------------------------------------

// User Registration
router.post(
  "/register",
  [
    body("name").isString().trim().isLength({ min: 3, max: 50 }).withMessage("Name must be 3-50 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password").isString().isLength({ min: 8, max: 128 }).withMessage("Password must be 8-128 characters"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Confirm password must match password");
      }
      return true;
    })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { name, email, password, phoneNumber } = req.body;

      // Check duplicate email
      const duplicate = await User.findOne({ email });
      if (duplicate) {
        return res.status(400).json({ error: "Email is already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phoneNumber: phoneNumber || ""
      });

      console.log(`👤 New user registered: ${email}`);

      // Generate JWT token
      const secret = process.env.JWT_SECRET || "floracraft_jwt_secret_token_key_development_only_123";
      const token = jwt.sign(
        { id: user._id, role: "user" },
        secret,
        { algorithm: "HS256", expiresIn: "2h" }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          profileImage: user.profileImage
        }
      });
    } catch (e) {
      next(e);
    }
  }
);

// User Login (Rate Limited)
router.post(
  "/login",
  authRateLimiter,
  [
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password").isString().isLength({ min: 8, max: 128 }).withMessage("Password must be 8-128 characters")
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Check if it's the admin logging in
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      if (email === adminUsername) {
        const adminHash = process.env.ADMIN_PASSWORD_HASH;
        let isMatch = false;

        if (adminHash) {
          isMatch = await bcrypt.compare(password, adminHash);
        } else if (process.env.NODE_ENV !== "production") {
          isMatch = (password === (process.env.ADMIN_PASSWORD || "admin123"));
        }

        if (!isMatch) {
          console.warn(`⚠️ Failed admin login attempt`);
          return res.status(401).json({ error: "Invalid username or password" });
        }

        console.log(`🛡️ Admin successfully logged in: ${adminUsername}`);
        const secret = process.env.JWT_SECRET || "floracraft_jwt_secret_token_key_development_only_123";
        const token = jwt.sign(
          { id: "admin", role: "admin" },
          secret,
          { algorithm: "HS256", expiresIn: "2h" }
        );

        return res.json({
          token,
          user: {
            id: "admin",
            name: "Administrator",
            email: adminUsername,
            role: "admin"
          }
        });
      }

      // Customer check
      const user = await User.findOne({ email });
      if (!user) {
        console.warn(`⚠️ Failed login attempt: Email not found - ${email}`);
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.warn(`⚠️ Failed login attempt: Wrong password - ${email}`);
        return res.status(401).json({ error: "Invalid username or password" });
      }

      console.log(`🔑 User successfully logged in: ${email}`);

      const secret = process.env.JWT_SECRET || "floracraft_jwt_secret_token_key_development_only_123";
      const token = jwt.sign(
        { id: user._id, role: "user" },
        secret,
        { algorithm: "HS256", expiresIn: "2h" }
      );

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          profileImage: user.profileImage,
          role: "user"
        }
      });
    } catch (e) {
      next(e);
    }
  }
);

// Verify Token Status (works for both users and admins)
router.get("/verify", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or malformed authorization token" });
    }
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "floracraft_jwt_secret_token_key_development_only_123";
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    res.json({ status: "ok", user: decoded });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token has expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
});

// Fetch Active User Info
router.get("/me", userAuth, (req, res) => {
  const user = req.user.toObject();
  delete user.password;
  res.json(user);
});

// ----------------------------------------------------
// PROFILE & SECURITY MANAGEMENT
// ----------------------------------------------------

// Update Profile Info
router.put(
  "/profile",
  userAuth,
  [
    body("name").isString().trim().isLength({ min: 3, max: 50 }).withMessage("Name must be 3-50 characters"),
    body("phoneNumber").optional({ checkFalsy: true }).isString().trim().isLength({ min: 10, max: 15 }).withMessage("Phone number must be 10-15 digits"),
    body("profileImage").optional({ checkFalsy: true }).isString().trim().withMessage("Invalid profile image URL")
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { name, phoneNumber, profileImage } = req.body;
      const user = req.user;
      
      user.name = name;
      if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
      if (profileImage !== undefined) user.profileImage = profileImage;
      
      await user.save();
      console.log(`👤 Profile updated for user: ${user.email}`);

      const responseUser = user.toObject();
      delete responseUser.password;
      res.json(responseUser);
    } catch (e) {
      next(e);
    }
  }
);

// Update Password
router.put(
  "/password",
  userAuth,
  [
    body("oldPassword").isString().notEmpty().withMessage("Old password is required"),
    body("newPassword").isString().isLength({ min: 8, max: 128 }).withMessage("New password must be 8-128 characters"),
    body("confirmNewPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Confirm password must match new password");
      }
      return true;
    })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = req.user;

      // Verify current password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid current password" });
      }

      // Hash and update new password
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      console.log(`🔑 Password updated for user: ${user.email}`);
      res.json({ message: "Password updated successfully" });
    } catch (e) {
      next(e);
    }
  }
);

// ----------------------------------------------------
// ADDRESS MANAGEMENT ENDPOINTS
// ----------------------------------------------------

// List all addresses
router.get("/addresses", userAuth, (req, res) => {
  res.json(req.user.addresses || []);
});

// Add address
router.post(
  "/addresses",
  userAuth,
  [
    body("fullName").isString().trim().notEmpty().withMessage("Full name is required"),
    body("phoneNumber").isString().trim().notEmpty().withMessage("Phone number is required"),
    body("houseNumber").isString().trim().notEmpty().withMessage("House/Flat number is required"),
    body("street").isString().trim().notEmpty().withMessage("Street address is required"),
    body("landmark").optional().isString().trim(),
    body("city").isString().trim().notEmpty().withMessage("City is required"),
    body("state").isString().trim().notEmpty().withMessage("State is required"),
    body("country").isString().trim().notEmpty().withMessage("Country is required"),
    body("pincode").isString().trim().notEmpty().withMessage("Pincode is required"),
    body("isDefault").optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const user = req.user;
      const newAddress = req.body;

      if (newAddress.isDefault) {
        // Unset previous defaults
        user.addresses.forEach(addr => { addr.isDefault = false; });
      } else if (user.addresses.length === 0) {
        newAddress.isDefault = true;
      }

      user.addresses.push(newAddress);
      await user.save();

      console.log(`🏠 Address added for user: ${user.email}`);
      res.status(201).json(user.addresses);
    } catch (e) {
      next(e);
    }
  }
);

// Edit address
router.put(
  "/addresses/:id",
  userAuth,
  [
    body("fullName").isString().trim().notEmpty().withMessage("Full name is required"),
    body("phoneNumber").isString().trim().notEmpty().withMessage("Phone number is required"),
    body("houseNumber").isString().trim().notEmpty().withMessage("House/Flat number is required"),
    body("street").isString().trim().notEmpty().withMessage("Street address is required"),
    body("landmark").optional().isString().trim(),
    body("city").isString().trim().notEmpty().withMessage("City is required"),
    body("state").isString().trim().notEmpty().withMessage("State is required"),
    body("country").isString().trim().notEmpty().withMessage("Country is required"),
    body("pincode").isString().trim().notEmpty().withMessage("Pincode is required"),
    body("isDefault").optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const user = req.user;
      const addrId = req.params.id;
      const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addrId);

      if (addressIndex === -1) {
        return res.status(404).json({ error: "Address not found" });
      }

      const updatedData = req.body;
      if (updatedData.isDefault) {
        user.addresses.forEach(addr => { addr.isDefault = false; });
      }

      user.addresses[addressIndex] = { ...user.addresses[addressIndex].toObject(), ...updatedData };
      await user.save();

      console.log(`🏠 Address updated for user: ${user.email}`);
      res.json(user.addresses);
    } catch (e) {
      next(e);
    }
  }
);

// Delete address
router.delete("/addresses/:id", userAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const addrId = req.params.id;
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addrId);

    if (addressIndex === -1) {
      return res.status(404).json({ error: "Address not found" });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If we deleted the default address, set the first remaining one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    console.log(`🏠 Address deleted for user: ${user.email}`);
    res.json(user.addresses);
  } catch (e) {
    next(e);
  }
});

// Set default address
router.put("/addresses/:id/default", userAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const addrId = req.params.id;
    const address = user.addresses.find(addr => addr._id.toString() === addrId);

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === addrId;
    });

    await user.save();
    console.log(`🏠 Default address set for user: ${user.email}`);
    res.json(user.addresses);
  } catch (e) {
    next(e);
  }
});

// ----------------------------------------------------
// WISHLIST ENDPOINTS
// ----------------------------------------------------

// View Wishlist
router.get("/wishlist", userAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.json(user.wishlist || []);
  } catch (e) {
    next(e);
  }
});

// Toggle Wishlist (Add or Remove)
router.post("/wishlist/toggle", userAuth, async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const plant = await Plant.findById(productId);
    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    const user = req.user;
    const index = user.wishlist.indexOf(productId);

    let added = false;
    if (index === -1) {
      user.wishlist.push(productId);
      added = true;
      console.log(`❤️ Added plant ${productId} to user ${user.email} wishlist`);
    } else {
      user.wishlist.splice(index, 1);
      console.log(`💔 Removed plant ${productId} from user ${user.email} wishlist`);
    }

    await user.save();
    const updatedUser = await User.findById(user._id).populate("wishlist");
    res.json({ added, wishlist: updatedUser.wishlist });
  } catch (e) {
    next(e);
  }
});

export default router;
