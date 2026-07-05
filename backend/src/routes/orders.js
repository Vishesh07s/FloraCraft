import { Router } from "express";
import { Order } from "../models/Order.js";
import { Cart } from "../models/Cart.js";
import { Plant } from "../models/Plant.js";
import { userAuth } from "../middleware/userAuth.js";
import { body, validationResult } from "express-validator";

const router = Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Place order (Checkout)
router.post(
  "/checkout",
  userAuth,
  [
    body("paymentMethod").isIn(["COD", "Online"]).withMessage("Invalid payment method"),
    body("addressId").optional().isMongoId().withMessage("Invalid address ID"),
    body("shippingAddress").optional().isObject().withMessage("Invalid shipping address object")
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { paymentMethod, addressId, shippingAddress } = req.body;
      const user = req.user;

      // 1. Fetch user's cart
      const cart = await Cart.findOne({ user: user._id }).populate("items.product");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ error: "Cannot place an order with an empty cart" });
      }

      // 2. Select & validate shipping address
      let selectedAddress = null;
      if (addressId) {
        selectedAddress = user.addresses.find(addr => addr._id.toString() === addressId);
        if (!selectedAddress) {
          return res.status(400).json({ error: "Selected address not found" });
        }
      } else if (shippingAddress) {
        const { fullName, phoneNumber, houseNumber, street, city, state, country, pincode } = shippingAddress;
        if (!fullName || !phoneNumber || !houseNumber || !street || !city || !state || !country || !pincode) {
          return res.status(400).json({ error: "Incomplete shipping address details" });
        }
        selectedAddress = shippingAddress;
      } else {
        // Fallback to default address
        selectedAddress = user.addresses.find(addr => addr.isDefault);
        if (!selectedAddress && user.addresses.length > 0) {
          selectedAddress = user.addresses[0];
        }
        if (!selectedAddress) {
          return res.status(400).json({ error: "Shipping address is required" });
        }
      }

      // 3. Verify stock, calculate total, and prepare order products
      const orderProducts = [];
      let totalAmount = 0;

      for (const item of cart.items) {
        const plant = item.product;
        if (!plant) {
          return res.status(400).json({ error: "One of the products in your cart no longer exists" });
        }

        if (!plant.available || plant.stock < item.quantity) {
          return res.status(400).json({ 
            error: `Product "${plant.name}" is out of stock or has insufficient quantity (${plant.stock} remaining)` 
          });
        }

        orderProducts.push({
          product: plant._id,
          name: plant.name,
          price: plant.price,
          quantity: item.quantity,
          image: plant.image
        });

        totalAmount += plant.price * item.quantity;
      }

      // 4. Deduct stock from database
      for (const item of cart.items) {
        const plant = await Plant.findById(item.product._id);
        plant.stock -= item.quantity;
        if (plant.stock <= 0) {
          plant.stock = 0;
          plant.available = false;
        }
        await plant.save();
      }

      // 5. Setup Payment Details
      let paymentStatus = "Pending";
      let transactionId = "";

      if (paymentMethod === "Online") {
        // Simulate a successful online payment transaction
        paymentStatus = "Paid";
        transactionId = `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      }

      // 6. Create the order
      const order = await Order.create({
        user: user._id,
        products: orderProducts,
        shippingAddress: {
          fullName: selectedAddress.fullName,
          phoneNumber: selectedAddress.phoneNumber,
          houseNumber: selectedAddress.houseNumber,
          street: selectedAddress.street,
          landmark: selectedAddress.landmark || "",
          city: selectedAddress.city,
          state: selectedAddress.state,
          country: selectedAddress.country,
          pincode: selectedAddress.pincode
        },
        paymentMethod,
        paymentStatus,
        orderStatus: "Pending",
        transactionId,
        totalAmount
      });

      // 7. Clear user cart
      cart.items = [];
      await cart.save();

      console.log(`📦 Order placed successfully: OrderID - ${order._id}, UserID - ${user._id}, Total - ₹${totalAmount}`);
      res.status(201).json(order);
    } catch (e) {
      next(e);
    }
  }
);

// View User Orders History
router.get("/", userAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

// View specific order details
router.get("/:id", userAuth, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (e) {
    next(e);
  }
});

// Cancel Eligible Order (Pending or Processing states only)
router.post("/:id/cancel", userAuth, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.orderStatus !== "Pending" && order.orderStatus !== "Processing") {
      return res.status(400).json({ 
        error: `Cannot cancel order at this stage. Current status: ${order.orderStatus}` 
      });
    }

    // 1. Update Order Status
    order.orderStatus = "Cancelled";
    if (order.paymentStatus === "Paid" && order.paymentMethod === "Online") {
      // Simulate refund
      order.paymentStatus = "Failed"; // Refunded / Failed
    }
    await order.save();

    // 2. Restore Product Stock
    for (const item of order.products) {
      const plant = await Plant.findById(item.product);
      if (plant) {
        plant.stock += item.quantity;
        plant.available = true; // Ensure it's marked available again
        await plant.save();
      }
    }

    console.log(`📦 Order cancelled by user: OrderID - ${order._id}, UserID - ${req.user._id}`);
    res.json(order);
  } catch (e) {
    next(e);
  }
});

export default router;
