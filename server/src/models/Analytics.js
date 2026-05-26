import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  totalOrders: Number,
  totalRevenue: Number,
  averageOrderValue: Number,
  topItems: [
    {
      itemId: mongoose.Schema.Types.ObjectId,
      name: String,
      quantity: Number,
      revenue: Number,
    },
  ],
  hourlyData: [
    {
      hour: Number,
      orders: Number,
      revenue: Number,
    },
  ],
  customerMetrics: {
    newCustomers: Number,
    returningCustomers: Number,
    totalCustomers: Number,
  },
});

export default mongoose.model("Analytics", analyticsSchema);
