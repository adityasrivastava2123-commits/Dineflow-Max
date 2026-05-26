import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    tableNumber: Number,
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
        },
        name: String,
        price: Number,
        quantity: Number,
        specialInstructions: String,
        addons: [
          {
            name: String,
            price: Number,
          },
        ],
      },
    ],
    subtotal: Number,
    tax: Number,
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: Number,
    notes: String,
    status: {
      type: String,
      enum: ["pending", "accepted", "preparing", "ready", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    startedAt: Date,
    completedAt: Date,
    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", orderSchema);
