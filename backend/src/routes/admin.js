import { Router } from "express";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Plant } from "../models/Plant.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { body, validationResult } from "express-validator";

const router = Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Protect all routes in this file with admin authorization
router.use(adminAuth);

// Get Admin Dashboard Statistics
router.get("/stats", async (req, res, next) => {
  try {
    const [totalProducts, totalUsers, totalOrders, nonCancelledOrders] = await Promise.all([
      Plant.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
      Order.find({ orderStatus: { $ne: "Cancelled" } })
    ]);

    const totalRevenue = nonCancelledOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenue
    });
  } catch (e) {
    next(e);
  }
});

// View all orders (sorted by newest first)
router.get("/orders", async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

// Update order status & payment status
router.put(
  "/orders/:id/status",
  [
    body("orderStatus").optional().isIn(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]).withMessage("Invalid order status"),
    body("paymentStatus").optional().isIn(["Pending", "Paid", "Failed"]).withMessage("Invalid payment status")
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const previousStatus = order.orderStatus;
      const { orderStatus, paymentStatus } = req.body;

      if (orderStatus !== undefined) {
        order.orderStatus = orderStatus;
      }
      if (paymentStatus !== undefined) {
        order.paymentStatus = paymentStatus;
      }

      // If status transitioned to Cancelled, restore stock (only if it wasn't already Cancelled)
      if (orderStatus === "Cancelled" && previousStatus !== "Cancelled") {
        for (const item of order.products) {
          const plant = await Plant.findById(item.product);
          if (plant) {
            plant.stock += item.quantity;
            plant.available = true;
            await plant.save();
          }
        }
      }

      await order.save();
      console.log(`🛡️ Admin updated order status: OrderID - ${order._id}, Status - ${orderStatus}, Payment - ${paymentStatus}`);
      res.json(order);
    } catch (e) {
      next(e);
    }
  }
);

// View all registered users (excluding passwords)
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

// Update plant product details
router.put(
  "/plants/:id",
  [
    body("name").optional().isString().trim().isLength({ min: 2, max: 80 }),
    body("price").optional().isFloat({ min: 0 }),
    body("categories").optional().isArray({ min: 1 }),
    body("categories.*").optional().isString().trim(),
    body("available").optional().isBoolean(),
    body("image").optional().isString(),
    body("description").optional().isString(),
    body("stock").optional().isInt({ min: 0 }),
    body("rating").optional().isFloat({ min: 0, max: 5 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const plant = await Plant.findById(req.params.id);
      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }

      const updates = req.body;
      
      // Update fields
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          plant[key] = updates[key];
        }
      });

      await plant.save();
      console.log(`🛡️ Admin updated plant product: ProductID - ${plant._id}, Name - ${plant.name}`);
      res.json(plant);
    } catch (e) {
      next(e);
    }
  }
);

// Delete plant product
router.delete("/plants/:id", async (req, res, next) => {
  try {
    const plant = await Plant.findByIdAndDelete(req.params.id);
    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    console.log(`🛡️ Admin deleted plant product: ProductID - ${req.params.id}, Name - ${plant.name}`);
    res.json({ message: "Plant deleted successfully" });
  } catch (e) {
    next(e);
  }
});

export default router;
