import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getRestaurantOrders,
  getLiveOrders,
  cancelOrder,
  getCustomerHistory,
} from "../controllers/orderCtrl.js";
import { authMiddleware, roleMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer routes
router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getOrders);

// Kitchen live orders (must come before /:id)
router.get("/kitchen/live", authMiddleware, roleMiddleware(["admin", "manager", "kitchen", "staff"]), getLiveOrders);
router.get("/customer/history", getCustomerHistory);

// Admin
router.get("/restaurant/all", authMiddleware, roleMiddleware(["admin", "manager", "kitchen", "staff"]), getRestaurantOrders);

// By ID
router.get("/:id", authMiddleware, getOrderById);
router.patch("/:id/status", authMiddleware, roleMiddleware(["admin", "manager", "kitchen", "staff"]), updateOrderStatus);
router.post("/:id/cancel", authMiddleware, cancelOrder);

export default router;
