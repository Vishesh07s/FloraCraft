import mongoose from "mongoose";
const PlantSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  categories: { type: [String], index: true, default: [] },
  available: { type: Boolean, default: true },
  image: { type: String, default: "" },
  rating: { type: Number, min: 0, max: 5, default: 4.5 }
}, { timestamps: true });
PlantSchema.index({ name: "text", categories: "text" });
export const Plant = mongoose.model("Plant", PlantSchema);