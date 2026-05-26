import Razorpay from "razorpay";
import crypto from "crypto";
import logger from "../utils/logger.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (amount, currency, receiptId, notes) => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receiptId,
      notes,
    });

    return order;
  } catch (error) {
    logger.error("Razorpay order creation error:", error);
    throw new Error("Failed to create payment order");
  }
};

export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    logger.error("Payment signature verification error:", error);
    return false;
  }
};

export const createTransfer = async (paymentId, amount, recipientId) => {
  try {
    const transfer = await razorpay.payments.transfer(paymentId, {
      amount: Math.round(amount * 100),
      recipient: recipientId,
    });

    return transfer;
  } catch (error) {
    logger.error("Razorpay transfer error:", error);
    throw new Error("Failed to process transfer");
  }
};

export default razorpay;
