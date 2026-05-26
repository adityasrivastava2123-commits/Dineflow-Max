import http from "http";
import dotenv from "dotenv";
import app, { initializeSocket } from "./app.js";
import logger from "./utils/logger.js";
import mongoose from "mongoose";
import { cleanupOldInvoices } from "./utils/invoiceGenerator.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// ── MongoDB ───────────────────────────────────────────────────
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.warn("MONGODB_URI not set. Skipping DB connection.");
    return;
  }
  try {
    await mongoose.connect(uri);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// ── BullMQ Workers (lazy — only start if Redis is reachable) ─
const startWorkers = async () => {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    logger.warn("Redis not configured. Background workers disabled.");
    return;
  }
  try {
    const { invoiceWorker } = await import("./workers/invoiceWorker.js");
    const { whatsappWorker } = await import("./workers/whatsappWorker.js");
    logger.info("BullMQ workers started (invoice, whatsapp)");
  } catch (err) {
    logger.warn("Workers failed to start (non-fatal):", err.message);
  }
};

// ── HTTP + Socket ─────────────────────────────────────────────
const server = http.createServer(app);
initializeSocket(server);

// ── Invoice cleanup (runs every 24h) ─────────────────────────
const scheduleCleanup = () => {
  setInterval(() => {
    cleanupOldInvoices();
    logger.debug("Old invoice files cleaned up");
  }, 24 * 60 * 60 * 1000);
};

// ── Startup ───────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();
    await startWorkers();
    scheduleCleanup();

    server.listen(PORT, () => {
      logger.info(`DineFlow Pro API running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`Docs: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error("Server startup failed:", error);
    process.exit(1);
  }
};

// ── Process handlers ──────────────────────────────────────────
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled Rejection:", error);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down gracefully");
  server.close(() => {
    mongoose.connection.close();
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received — shutting down");
  server.close(() => process.exit(0));
});

startServer();
