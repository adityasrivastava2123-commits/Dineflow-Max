import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    description: String,
    discount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUpto: {
      type: Date,
      required: true,
    },
    minimumOrderValue: {
      type: Number,
      default: 0,
    },
    maximumDiscount: Number,
    usageLimit: Number,
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Offer", offerSchema);
