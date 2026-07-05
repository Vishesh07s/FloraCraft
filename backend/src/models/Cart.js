import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Plant", required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 }
});

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  items: { type: [CartItemSchema], default: [] }
}, { timestamps: true });

export const Cart = mongoose.model("Cart", CartSchema);
