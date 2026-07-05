import { Router } from "express";
import { Cart } from "../models/Cart.js";
import { Plant } from "../models/Plant.js";
import { userAuth } from "../middleware/userAuth.js";

const router = Router();

// Helper to get or create cart
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// Fetch customer cart
router.get("/", userAuth, async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    await cart.populate("items.product");
    res.json(cart);
  } catch (e) {
    next(e);
  }
});

// Add item to cart
router.post("/add", userAuth, async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const qtyNum = Math.max(parseInt(quantity) || 1, 1);
    const plant = await Plant.findById(productId);
    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    if (!plant.available || plant.stock <= 0) {
      return res.status(400).json({ error: "Plant is currently out of stock" });
    }

    const cart = await getOrCreateCart(req.user._id);
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    let newQty = qtyNum;
    if (itemIndex > -1) {
      newQty = cart.items[itemIndex].quantity + qtyNum;
    }

    // Stock check
    if (newQty > plant.stock) {
      return res.status(400).json({ 
        error: `Cannot add more. Only ${plant.stock} units available in stock.` 
      });
    }

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = newQty;
    } else {
      cart.items.push({ product: productId, quantity: qtyNum });
    }

    await cart.save();
    await cart.populate("items.product");
    console.log(`🛒 Cart add: User ${req.user.email} added product ${productId} (Qty: ${qtyNum})`);
    res.json(cart);
  } catch (e) {
    next(e);
  }
});

// Update item quantity
router.post("/update-quantity", userAuth, async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity === undefined) {
      return res.status(400).json({ error: "Product ID and quantity are required" });
    }

    const qtyNum = parseInt(quantity);
    if (qtyNum <= 0) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    const plant = await Plant.findById(productId);
    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    // Stock check
    if (qtyNum > plant.stock) {
      return res.status(400).json({ 
        error: `Only ${plant.stock} units available in stock.` 
      });
    }

    const cart = await getOrCreateCart(req.user._id);
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    cart.items[itemIndex].quantity = qtyNum;
    await cart.save();
    await cart.populate("items.product");

    console.log(`🛒 Cart quantity update: User ${req.user.email} set product ${productId} quantity to ${qtyNum}`);
    res.json(cart);
  } catch (e) {
    next(e);
  }
});

// Remove item from cart
router.post("/remove", userAuth, async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const cart = await getOrCreateCart(req.user._id);
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      cart.items.splice(itemIndex, 1);
      await cart.save();
    }

    await cart.populate("items.product");
    console.log(`🛒 Cart remove: User ${req.user.email} removed product ${productId}`);
    res.json(cart);
  } catch (e) {
    next(e);
  }
});

// Clear cart
router.post("/clear", userAuth, async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    
    console.log(`🛒 Cart cleared for user ${req.user.email}`);
    res.json(cart);
  } catch (e) {
    next(e);
  }
});

export default router;
