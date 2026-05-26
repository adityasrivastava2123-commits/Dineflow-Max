import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import logger from "../utils/logger.js";

export const invoiceQueue = new Queue("invoice-generation", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const addInvoiceJob = async (orderId, options = {}) => {
  try {
    const job = await invoiceQueue.add(
      "generate-invoice",
      { orderId },
      {
        priority: options.priority || 5,
        delay: options.delay || 0,
        jobId: `invoice-${orderId}`,
      }
    );
    logger.info(`Invoice job added for order: ${orderId}, jobId: ${job.id}`);
    return job;
  } catch (error) {
    logger.error("Failed to add invoice job:", error);
    throw error;
  }
};

invoiceQueue.on("error", (error) => {
  logger.error("Invoice queue error:", error);
});

export default invoiceQueue;
