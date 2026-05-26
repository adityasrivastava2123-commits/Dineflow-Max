import { Worker, Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import logger from "../utils/logger.js";
import https from "https";
import fs from "fs";
import path from "path";

// WhatsApp notification queue
export const whatsappQueue = new Queue("whatsapp-notifications", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 100 },
  },
});

/**
 * Send a WhatsApp message via CallMeBot API
 * @param {string} phone - Phone number with country code
 * @param {string} apiKey - CallMeBot API key
 * @param {string} message - Message text
 */
const sendWhatsAppMessage = async (phone, apiKey, message) => {
  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`WhatsApp API error: ${res.statusCode} - ${data}`));
          }
        });
      })
      .on("error", reject);
  });
};

/**
 * Build order confirmation message
 */
const buildOrderConfirmationMessage = (order, restaurant) => {
  const items = order.items
    .map((item) => `  • ${item.name} x${item.quantity} — ₹${(item.price * item.quantity).toFixed(0)}`)
    .join("\n");

  return (
    `🍽️ *Order Confirmed — ${restaurant.name}*\n\n` +
    `📋 Order ID: #${order.orderNumber}\n` +
    `🪑 Table: ${order.tableNumber}\n\n` +
    `*Items:*\n${items}\n\n` +
    `💰 Subtotal: ₹${order.subtotal?.toFixed(0)}\n` +
    `🧾 Tax: ₹${order.tax?.toFixed(0)}\n` +
    `✅ *Total: ₹${order.totalAmount?.toFixed(0)}*\n\n` +
    `Track your order: ${process.env.CLIENT_URL}/order/${order._id}`
  );
};

/**
 * Build order ready message
 */
const buildOrderReadyMessage = (order, restaurant) => {
  return (
    `✅ *Your order is ready!*\n\n` +
    `🍽️ ${restaurant.name}\n` +
    `📋 Order: #${order.orderNumber} | Table ${order.tableNumber}\n\n` +
    `Your food is being brought to your table. Enjoy your meal! 😊`
  );
};

/**
 * Build invoice message with PDF link
 */
const buildInvoiceMessage = (order, restaurant, invoiceUrl) => {
  return (
    `🧾 *Invoice from ${restaurant.name}*\n\n` +
    `Order: #${order.orderNumber}\n` +
    `Amount Paid: ₹${order.totalAmount?.toFixed(0)}\n\n` +
    `Download your invoice:\n${invoiceUrl}\n\n` +
    `Thank you for dining with us! ⭐`
  );
};

const processWhatsAppJob = async (job) => {
  const { type, orderId, invoiceUrl } = job.data;
  logger.info(`Processing WhatsApp job: ${type} for order: ${orderId}`);

  const order = await Order.findById(orderId)
    .populate("customer", "name phone")
    .populate("restaurant", "name whatsappNumber callMeBotApiKey");

  if (!order) throw new Error(`Order ${orderId} not found`);

  const restaurant = order.restaurant;
  if (!restaurant?.whatsappNumber || !restaurant?.callMeBotApiKey) {
    logger.warn(`WhatsApp not configured for restaurant ${restaurant?._id}`);
    return { skipped: true, reason: "WhatsApp not configured" };
  }

  const customerPhone = order.customer?.phone || job.data.phone;
  if (!customerPhone) {
    logger.warn("No customer phone for WhatsApp notification");
    return { skipped: true, reason: "No customer phone" };
  }

  let message;
  switch (type) {
    case "order-confirmed":
      message = buildOrderConfirmationMessage(order, restaurant);
      break;
    case "order-ready":
      message = buildOrderReadyMessage(order, restaurant);
      break;
    case "invoice":
      if (!invoiceUrl) return { skipped: true, reason: "No invoice URL" };
      message = buildInvoiceMessage(order, restaurant, invoiceUrl);
      break;
    default:
      throw new Error(`Unknown WhatsApp job type: ${type}`);
  }

  await sendWhatsAppMessage(customerPhone, restaurant.callMeBotApiKey, message);
  logger.info(`WhatsApp ${type} sent for order: ${orderId}`);
  return { sent: true, type, orderId };
};

export const whatsappWorker = new Worker(
  "whatsapp-notifications",
  processWhatsAppJob,
  {
    connection: redisConnection,
    concurrency: 2,
    limiter: { max: 5, duration: 1000 }, // 5 msgs/sec max
  }
);

whatsappWorker.on("completed", (job, result) => {
  if (!result.skipped) {
    logger.info(`WhatsApp job ${job.id} sent: ${result.type}`);
  }
});

whatsappWorker.on("failed", (job, error) => {
  logger.error(`WhatsApp job ${job?.id} failed:`, error.message);
});

whatsappWorker.on("error", (error) => {
  logger.error("WhatsApp worker error:", error);
});

// Queue helper functions
export const queueOrderConfirmation = (orderId, phone) =>
  whatsappQueue.add("order-confirmed", { type: "order-confirmed", orderId, phone });

export const queueOrderReady = (orderId) =>
  whatsappQueue.add("order-ready", { type: "order-ready", orderId });

export const queueInvoiceWhatsApp = (orderId, invoiceUrl) =>
  whatsappQueue.add("invoice", { type: "invoice", orderId, invoiceUrl });

export default whatsappWorker;
