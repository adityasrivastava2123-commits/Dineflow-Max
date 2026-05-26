import express from "express";
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  refreshAccessToken,
  seedDemoData,
  customerIdentify,
  createStaff,
  getStaffMembers,
  deleteStaffMember,
} from "../controllers/authCtrl.js";
import { authMiddleware, roleMiddleware } from "../middleware/authMiddleware.js";
import { strictRateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

// Public
router.post("/register", strictRateLimit, register);
router.post("/login", strictRateLimit, login);
router.post("/refresh-token", refreshAccessToken);
router.post("/customer-identify", strictRateLimit, customerIdentify);

// Authenticated
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getProfile);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

// Staff management
router.post(
  "/staff",
  authMiddleware,
  roleMiddleware(["admin", "manager", "superadmin"]),
  createStaff
);
router.get(
  "/staff",
  authMiddleware,
  roleMiddleware(["admin", "manager", "superadmin"]),
  getStaffMembers
);
router.delete(
  "/staff/:id",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  deleteStaffMember
);

// Dev only
router.post("/seed-demo", authMiddleware, seedDemoData);

export default router;
