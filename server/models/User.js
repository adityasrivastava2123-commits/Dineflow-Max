const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, sparse: true, unique: true },
  password: { type: String },
  phone: { type: String },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'manager', 'kitchen', 'customer'],
    default: 'customer'
  },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  loyaltyPoints: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  avatar: String
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ restaurantId: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
