const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  addons: [{ name: String, price: Number }],
  portion: { size: String, price: Number },
  specialInstructions: String,
  isVeg: Boolean
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  tableNumber: String,
  items: [orderItemSchema],
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: { type: String, enum: ['cash', 'razorpay'], default: 'cash' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  tipAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  offerCode: String,
  loyaltyPointsUsed: { type: Number, default: 0 },
  loyaltyPointsEarned: { type: Number, default: 0 },
  notes: String,
  estimatedReadyAt: Date,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  refundId: String,
  refundAmount: Number,
  isScheduled: { type: Boolean, default: false },
  scheduledFor: Date,
  splitBill: [{
    name: String,
    amount: Number,
    paid: { type: Boolean, default: false }
  }],
  statusHistory: [{
    status: String,
    timestamp: Date,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  invoiceUrl: String,
  rating: { type: Number, min: 1, max: 5 }
}, { timestamps: true });

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments({ restaurantId: this.restaurantId });
    const date = new Date();
    this.orderNumber = `DF${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ customerPhone: 1, restaurantId: 1 });

module.exports = mongoose.model('Order', orderSchema);
