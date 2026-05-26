const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }
});

const portionSchema = new mongoose.Schema({
  size: { type: String, enum: ['Small', 'Medium', 'Large', 'Regular', 'Full', 'Half'] },
  price: { type: Number, required: true }
});

const menuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  nameHindi: String,
  description: String,
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: String,
  isVeg: { type: Boolean, default: true },
  isVegan: { type: Boolean, default: false },
  isJain: { type: Boolean, default: false },
  isGlutenFree: { type: Boolean, default: false },
  isBestseller: { type: Boolean, default: false },
  isSpicy: { type: Boolean, default: false },
  isCombo: { type: Boolean, default: false },
  comboDiscount: { type: Number, default: 0 },
  allergens: [{ type: String, enum: ['nuts', 'dairy', 'gluten', 'eggs', 'soy', 'shellfish', 'fish'] }],
  calories: Number,
  preparationTime: { type: Number, default: 15 },
  addons: [addonSchema],
  portions: [portionSchema],
  available: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  recipe: String,
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  tags: [String],
  menuType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'all'], default: 'all' },
  menuSchedule: {
    startTime: String,
    endTime: String
  }
}, { timestamps: true });

menuItemSchema.index({ restaurantId: 1, category: 1 });
menuItemSchema.index({ restaurantId: 1, available: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
