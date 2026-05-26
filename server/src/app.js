import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { Server } from "socket.io";
import logger from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalRateLimit } from "./middleware/rateLimit.js";
import { socketHandler } from "./socket/socket.js";

// Import routes
import authRoutes from "./routes/auth.js";
import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";
import analyticsRoutes from "./routes/analytics.js";
import offerRoutes from "./routes/offers.js";
import restaurantRoutes from "./routes/restaurant.js";
import invoiceRoutes from "./routes/invoices.js";

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // disabled for API
    crossOriginEmbedderPolicy: false,
  })
);

// ── CORS ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");
      if (!origin || allowed.includes(origin) || allowed.includes("*")) {
        cb(null, true);
      } else {
        cb(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ── Logging ───────────────────────────────────────────────────
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.url === "/api/health",
  })
);

// ── Rate limiting ─────────────────────────────────────────────
app.use(generalRateLimit);

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/invoices", invoiceRoutes);

// ── Health check ──────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DineFlow Pro API is running",
    version: process.env.npm_package_version || "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/health", (req, res) =>
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// ── Error handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Socket.io factory ─────────────────────────────────────────
export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
      credentials: true,
    },
    transports: (process.env.SOCKET_TRANSPORTS || "websocket,polling").split(","),
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  socketHandler(io);
  logger.info("Socket.io initialized");
  return io;
};

export default app;
