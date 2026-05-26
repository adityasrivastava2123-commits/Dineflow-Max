import express from "express";
import {
  getRestaurantBySlug,
  updateRestaurantSettings,
  getRestaurantStaff,
  addStaff,
} from "../controllers/restaurantCtrl.js";
import { authMiddleware, roleMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/:slug", getRestaurantBySlug);

// Authenticated admin routes
router.put(
  "/settings",
  authMiddleware,
  roleMiddleware(["admin", "manager", "superadmin"]),
  updateRestaurantSettings
);

router.get(
  "/staff",
  authMiddleware,
  roleMiddleware(["admin", "manager", "superadmin"]),
  getRestaurantStaff
);

router.post(
  "/staff",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  addStaff
);

export default router;
