import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide item name"],
    },
    description: String,
    price: {
      type: Number,
      required: [true, "Please provide price"],
    },
    category: {
      type: String,
      required: [true, "Please provide category"],
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    image: {
      url: String,
      publicId: String,
    },
    vegetarian: {
      type: Boolean,
      default: false,
    },
    spicyLevel: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    preparationTime: Number,
    tags: [String],
    addons: [
      {
        name: String,
        price: Number,
      },
    ],
    available: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("MenuItem", menuItemSchema);
