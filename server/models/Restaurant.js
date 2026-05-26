const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  number: { type: String, required: true },
  capacity: { type: Number, default: 4 },
  isOccupied: { type: Boolean, default: false },
  currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  qrCode: String,
  section: { type: String, default: 'Main' }
});

const operatingHoursSchema = new mongoose.Schema({
  day: { type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] },
  open: String,
  close: String,
  isClosed: { type: Boolean, default: false }
});

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  logo: String,
  coverImage: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  phone: String,
  email: { type: String, required: true },
  GSTIN: String,
  taxRate: { type: Number, default: 5 },
  serviceCharge: { type: Number, default: 0 },
  tables: [tableSchema],
  operatingHours: [operatingHoursSchema],
  settings: {
    acceptingOrders: { type: Boolean, default: true },
    estimatedPrepTime: { type: Number, default: 20 },
    happyHours: {
      enabled: { type: Boolean, default: false },
      startTime: String,
      endTime: String,
      discountPercent: { type: Number, default: 10 }
    },
    allowScheduledOrders: { type: Boolean, default: false },
    requirePhoneVerification: { type: Boolean, default: false }
  },
  subscription: {
    plan: { type: String, enum: ['trial','basic','standard','premium'], default: 'trial' },
    status: { type: String, enum: ['active','expired','cancelled'], default: 'active' },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    price: { type: Number, default: 0 }
  },
  whatsappNumber: String,
  callMeBotApiKey: String,
  branding: {
    primaryColor: { type: String, default: '#f97316' },
    secondaryColor: { type: String, default: '#1c1917' }
  },
  cuisine: [String],
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  branches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
  parentRestaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
