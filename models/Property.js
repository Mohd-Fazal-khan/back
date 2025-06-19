// models/Property.js
import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    location: {
      type: String,
      required: true,
    },
    propertytype: {
      type: String,
      required: true,
    },
    maxGuests: { type: Number, required: true },
    price: {
      type: Number,
      required: true,
    },

    images: [
      {
        type: String, // image URLs
      },
    ],

    amenities: [String], // Optional: ['WiFi', 'Pool', 'Parking']

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Property", propertySchema);
