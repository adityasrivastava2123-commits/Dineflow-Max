import express from "express";
import { createPayment, verifyPayment, handleWebhook, getPaymentHistory, refundPayment } from "../controllers/paymentCtrl.js";
import { authMiddleware, roleMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer: create payment order
router.post("/create-order", authMiddleware, createPayment);
// Customer: verify after payment
router.post("/verify", authMiddleware, verifyPayment);
// Razorpay webhook (no auth - uses signature verification)
router.post("/webhook", handleWebhook);
// Admin: payment history
router.get("/history", authMiddleware, roleMiddleware(["admin", "manager", "superadmin"]), getPaymentHistory);
// Admin: refund
router.post("/refund", authMiddleware, roleMiddleware(["admin", "manager", "superadmin"]), refundPayment);

export default router;
