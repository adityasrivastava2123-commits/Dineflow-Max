import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide restaurant name"],
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    phone: String,
    email: String,
    website: String,
    tables: {
      type: Number,
      default: 10,
    },
    cuisineType: [String],
    openingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },
    subscriptionExpiry: Date,
    features: {
      analytics: Boolean,
      advancedOffers: Boolean,
      kitchenDisplay: Boolean,
      multiLanguage: Boolean,
      whatsappIntegration: Boolean,
    },
    settings: {
      currency: { type: String, default: "INR" },
      taxPercent: { type: Number, default: 5 },
      deliveryCharges: { type: Number, default: 0 },
      minimumOrderValue: { type: Number, default: 0 },
      autoAcceptOrders: { type: Boolean, default: false },
      orderPreparationTime: { type: Number, default: 30 },
    },
    images: {
      logo: String,
      banner: String,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    monthlyRevenue: {
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

// Auto-generate slug
restaurantSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

export default mongoose.model("Restaurant", restaurantSchema);
