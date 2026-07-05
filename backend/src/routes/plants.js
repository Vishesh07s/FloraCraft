import { Router } from "express";
import { Plant } from "../models/Plant.js";
import { body, validationResult } from "express-validator";
import { adminAuth } from "../middleware/adminAuth.js";
import { userAuth } from "../middleware/userAuth.js";

const router = Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ----------------------------------------------------
// PUBLIC CATALOG ENDPOINTS
// ----------------------------------------------------

// List plants with search, filter, and sorting
router.get("/", async (req, res, next) => {
  try {
    const { q = "", category = "", inStock = "", sort = "", page = 1, limit = 12 } = req.query;
    const filters = {};

    if (q) {
      const regex = new RegExp(q, "i");
      filters.$or = [{ name: regex }, { categories: regex }];
    }
    if (category) filters.categories = category;
    if (inStock === "true" || inStock === "false") filters.available = inStock === "true";

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 }
    };
    const sortOption = sortMap[sort] || { createdAt: -1 };
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 12, 1), 60);

    const [items, total] = await Promise.all([
      Plant.find(filters).sort(sortOption).skip((pageNum - 1) * limitNum).limit(limitNum),
      Plant.countDocuments(filters)
    ]);
    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (e) {
    next(e);
  }
});

// Get a single plant's detailed information
router.get("/:id", async (req, res, next) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }
    res.json(plant);
  } catch (e) {
    next(e);
  }
});

// ----------------------------------------------------
// PROTECTED PLANT CREATION (ADMIN ONLY)
// ----------------------------------------------------

router.post("/",
  adminAuth,
  [
    body("name").isString().trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
    body("categories").isArray({ min: 1 }).withMessage("At least one category is required"),
    body("categories.*").isString().trim().isLength({ min: 2, max: 40 }),
    body("available").optional().isBoolean(),
    body("image").optional().isString(),
    body("description").optional().isString(),
    body("stock").optional().isInt({ min: 0 }),
    body("rating").optional().isFloat({ min: 0, max: 5 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const plant = await Plant.create(req.body);
      console.log(`🛡️ Admin created plant: ProductID - ${plant._id}, Name - ${plant.name}`);
      res.status(201).json(plant);
    } catch (e) {
      next(e);
    }
  }
);

// ----------------------------------------------------
// REVIEWS ENDPOINTS (CUSTOMER USER ONLY)
// ----------------------------------------------------

// Add/Update a Review
router.post(
  "/:id/reviews",
  userAuth,
  [
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be an integer between 1 and 5"),
    body("comment").isString().trim().notEmpty().withMessage("Review comment is required")
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const plant = await Plant.findById(req.params.id);
      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }

      const { rating, comment } = req.body;
      const user = req.user;

      // Check if user already left a review
      const existingReviewIndex = plant.reviews.findIndex(
        rev => rev.user.toString() === user._id.toString()
      );

      if (existingReviewIndex > -1) {
        // Update existing review
        plant.reviews[existingReviewIndex].rating = rating;
        plant.reviews[existingReviewIndex].comment = comment;
        plant.reviews[existingReviewIndex].createdAt = new Date();
      } else {
        // Add new review
        plant.reviews.push({
          user: user._id,
          userName: user.name,
          rating,
          comment
        });
      }

      // Recalculate average rating
      const totalRating = plant.reviews.reduce((sum, rev) => sum + rev.rating, 0);
      plant.rating = parseFloat((totalRating / plant.reviews.length).toFixed(1));

      await plant.save();
      console.log(`⭐ Review submitted for product ${plant._id} by user ${user.email}`);
      res.status(200).json(plant);
    } catch (e) {
      next(e);
    }
  }
);

// Delete User's Own Review
router.delete("/:id/reviews/:reviewId", userAuth, async (req, res, next) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    const review = plant.reviews.id(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Verify ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied. You can only delete your own review." });
    }

    // Remove review
    plant.reviews.pull(req.params.reviewId);

    // Recalculate average rating
    if (plant.reviews.length > 0) {
      const totalRating = plant.reviews.reduce((sum, rev) => sum + rev.rating, 0);
      plant.rating = parseFloat((totalRating / plant.reviews.length).toFixed(1));
    } else {
      plant.rating = 4.5; // Reset to default fallback rating if no reviews
    }

    await plant.save();
    console.log(`⭐ Review deleted for product ${plant._id} by user ${req.user.email}`);
    res.json(plant);
  } catch (e) {
    next(e);
  }
});

export default router;