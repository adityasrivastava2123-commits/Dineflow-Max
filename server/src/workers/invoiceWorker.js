import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import { generateInvoicePDF } from "../utils/invoiceGenerator.js";
import logger from "../utils/logger.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const processInvoiceJob = async (job) => {
  const { orderId } = job.data;
  logger.info(`Processing invoice for order: ${orderId}`);

  const order = await Order.findById(orderId)
    .populate("customer", "name email phone")
    .populate("items.menuItem")
    .populate("restaurant");

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const restaurant = order.restaurant;
  if (!restaurant) {
    throw new Error(`Restaurant not found for order ${orderId}`);
  }

  const { filepath, filename } = await generateInvoicePDF(order, restaurant);

  // Update order with invoice path
  await Order.findByIdAndUpdate(orderId, {
    invoicePath: filepath,
    invoiceGenerated: true,
    invoiceGeneratedAt: new Date(),
  });

  logger.info(`Invoice generated: ${filename} for order: ${orderId}`);
  return { filepath, filename };
};

export const invoiceWorker = new Worker(
  "invoice-generation",
  processInvoiceJob,
  {
    connection: redisConnection,
    concurrency: 3,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

invoiceWorker.on("completed", (job, result) => {
  logger.info(`Invoice job ${job.id} completed: ${result.filename}`);
});

invoiceWorker.on("failed", (job, error) => {
  logger.error(`Invoice job ${job?.id} failed:`, error.message);
});

invoiceWorker.on("error", (error) => {
  logger.error("Invoice worker error:", error);
});

invoiceWorker.on("stalled", (jobId) => {
  logger.warn(`Invoice job ${jobId} stalled`);
});

export default invoiceWorker;
