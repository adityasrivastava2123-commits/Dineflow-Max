const mongoose = require('mongoose');

// Review Model
const reviewSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  customerName: String,
  customerPhone: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

// SupportTicket Model
const supportTicketSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  customerName: String,
  customerPhone: String,
  subject: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['open', 'inprogress', 'resolved'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  messages: [{
    sender: String,
    senderRole: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Subscription Model
const subscriptionSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  plan: { type: String, enum: ['trial', 'basic', 'standard', 'premium'] },
  price: Number,
  startDate: Date,
  endDate: Date,
  paymentId: String,
  razorpayOrderId: String,
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  invoiceUrl: String
}, { timestamps: true });

// LoyaltyAccount Model
const loyaltyAccountSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  points: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  totalRedeemed: { type: Number, default: 0 },
  transactions: [{
    type: { type: String, enum: ['earn', 'redeem'] },
    points: Number,
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    description: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });
loyaltyAccountSchema.index({ phone: 1, restaurantId: 1 }, { unique: true });

// Inventory Model
const inventorySchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  unit: String,
  currentStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 5 },
  costPerUnit: Number,
  lastUpdated: { type: Date, default: Date.now },
  wastage: [{
    quantity: Number,
    reason: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Coupon Model
const couponSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  code: { type: String, required: true, uppercase: true },
  type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  value: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: Number,
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  validFrom: Date,
  validTo: Date,
  isActive: { type: Boolean, default: true },
  description: String
}, { timestamps: true });
couponSchema.index({ restaurantId: 1, code: 1 }, { unique: true });

module.exports = {
  Review: mongoose.model('Review', reviewSchema),
  SupportTicket: mongoose.model('SupportTicket', supportTicketSchema),
  Subscription: mongoose.model('Subscription', subscriptionSchema),
  LoyaltyAccount: mongoose.model('LoyaltyAccount', loyaltyAccountSchema),
  Inventory: mongoose.model('Inventory', inventorySchema),
  Coupon: mongoose.model('Coupon', couponSchema)
};
