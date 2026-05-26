import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import logger from "../utils/logger.js";
import razorpay, { createOrder, verifyPaymentSignature } from "../config/razorpay.js";

export const createPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Create Razorpay order
    const razorpayOrder = await createOrder(
      order.totalAmount,
      "INR",
      orderId,
      {
        orderId: order.orderNumber,
        customerId: order.customer.toString(),
      }
    );

    // Create payment record
    const payment = new Payment({
      order: orderId,
      amount: order.totalAmount,
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
    });

    await payment.save();

    res.status(201).json({
      success: true,
      data: {
        razorpayOrder,
        payment,
      },
    });
  } catch (error) {
    logger.error("Create payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    // Verify signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Update payment
    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    payment.status = "paid";
    payment.razorpayPaymentId = paymentId;
    payment.razorpaySignature = signature;
    payment.paidAt = new Date();
    await payment.save();

    // Update order
    const order = await Order.findByIdAndUpdate(
      payment.order,
      {
        paymentStatus: "paid",
        payment: payment._id,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: { payment, order },
    });
  } catch (error) {
    logger.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

export const handleWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;

    switch (event) {
      case "payment.authorized":
        logger.info("Payment authorized", payload);
        break;
      case "payment.failed":
        const failedPayment = await Payment.findOne({
          razorpayPaymentId: payload.payment.id,
        });
        if (failedPayment) {
          failedPayment.status = "failed";
          failedPayment.failureReason = payload.payment.error_reason;
          await failedPayment.save();
        }
        break;
      default:
        logger.info("Unknown webhook event", event);
    }

    res.status(200).json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    logger.error("Webhook error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"] || req.user.restaurant;
    const { limit = 50, page = 1, status } = req.query;

    const query = {};
    if (status) query.status = status;

    // Join through orders
    const payments = await Payment.find(query)
      .populate({ path: "order", match: { restaurant: restaurantId }, populate: { path: "customer", select: "name phone" } })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const filtered = payments.filter((p) => p.order !== null);

    res.status(200).json({
      success: true,
      data: { payments: filtered, total: filtered.length },
    });
  } catch (error) {
    logger.error("Get payment history error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payment history" });
  }
};

export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    const payment = await Payment.findById(paymentId).populate("order");
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({ success: false, message: "Only paid payments can be refunded" });
    }

    const refundAmount = amount ? Math.round(amount * 100) : Math.round(payment.amount * 100);

    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: refundAmount,
      speed: "normal",
      notes: { reason: reason || "Customer request" },
    });

    payment.status = "refunded";
    payment.refundId = refund.id;
    payment.refundAmount = refund.amount / 100;
    payment.refundedAt = new Date();
    await payment.save();

    await Order.findByIdAndUpdate(payment.order._id, { paymentStatus: "refunded" });

    res.status(200).json({
      success: true,
      message: "Refund initiated successfully",
      data: { refund, payment },
    });
  } catch (error) {
    logger.error("Refund error:", error);
    res.status(500).json({ success: false, message: "Refund failed" });
  }
};
