import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import logger from "../utils/logger.js";

export const analyticsQueue = new Queue("analytics-processing", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 50 },
  },
});

export const addAnalyticsEvent = async (type, payload) => {
  try {
    const job = await analyticsQueue.add(
      type,
      { ...payload, timestamp: new Date().toISOString() },
      { priority: 10 }
    );
    logger.debug(`Analytics event queued: ${type}, jobId: ${job.id}`);
    return job;
  } catch (error) {
    logger.error("Failed to queue analytics event:", error);
    // Non-critical: don't throw
  }
};

// Convenience helpers
export const trackOrderPlaced = (order) =>
  addAnalyticsEvent("order-placed", {
    orderId: order._id?.toString(),
    restaurantId: order.restaurant?.toString(),
    amount: order.totalAmount,
    items: order.items?.length,
    tableNumber: order.tableNumber,
  });

export const trackPaymentCompleted = (payment, order) =>
  addAnalyticsEvent("payment-completed", {
    paymentId: payment._id?.toString(),
    orderId: order._id?.toString(),
    restaurantId: order.restaurant?.toString(),
    amount: payment.amount,
    method: payment.paymentMethod,
  });

export const trackMenuView = (restaurantId, itemId) =>
  addAnalyticsEvent("menu-view", { restaurantId, itemId });

analyticsQueue.on("error", (error) => {
  logger.error("Analytics queue error:", error);
});

export default analyticsQueue;
