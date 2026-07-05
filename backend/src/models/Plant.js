import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PlantSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  categories: { type: [String], index: true, default: [] },
  available: { type: Boolean, default: true },
  image: { type: String, default: "" },
  rating: { type: Number, min: 0, max: 5, default: 4.5 },
  description: { type: String, default: "" },
  images: { type: [String], default: [] },
  stock: { type: Number, default: 15, min: 0 },
  reviews: { type: [ReviewSchema], default: [] }
}, { timestamps: true });

PlantSchema.index({ name: "text", categories: "text" });
export const Plant = mongoose.model("Plant", PlantSchema);