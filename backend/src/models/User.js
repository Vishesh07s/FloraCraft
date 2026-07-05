import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  houseNumber: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  landmark: { type: String, default: "", trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    index: true 
  },
  password: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  phoneNumber: { type: String, default: "", trim: true },
  profileImage: { type: String, default: "" },
  addresses: { type: [AddressSchema], default: [] },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Plant" }]
}, { timestamps: true });

export const User = mongoose.model("User", UserSchema);
