import express from "express";
import {
  getDashboardMetrics,
  getRevenueAnalytics,
  getTopSellingItems,
  getPeakHours,
  getCustomerMetrics,
} from "../controllers/analyticsCtrl.js";
import { authMiddleware, roleMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const adminRoles = ["admin", "manager", "superadmin"];

router.get("/dashboard", authMiddleware, roleMiddleware(adminRoles), getDashboardMetrics);
router.get("/revenue", authMiddleware, roleMiddleware(adminRoles), getRevenueAnalytics);
router.get("/revenue-trend", authMiddleware, roleMiddleware(adminRoles), getRevenueAnalytics);
router.get("/top-items", authMiddleware, roleMiddleware(adminRoles), getTopSellingItems);
router.get("/peak-hours", authMiddleware, roleMiddleware(adminRoles), getPeakHours);
router.get("/customers", authMiddleware, roleMiddleware(adminRoles), getCustomerMetrics);

export default router;
