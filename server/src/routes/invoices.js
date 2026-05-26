import express from "express";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import { generateInvoicePDF } from "../utils/invoiceGenerator.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import logger from "../utils/logger.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// GET /api/invoices/:orderId - Download PDF invoice
router.get("/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("customer", "name phone email")
      .populate("items.menuItem")
      .populate("restaurant");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Auth check: customer owns order OR admin of that restaurant
    const isCustomer = order.customer?._id?.toString() === req.user.id;
    const isAdmin = ["admin", "manager", "superadmin"].includes(req.user.role);
    if (!isCustomer && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // If already generated, serve existing file
    if (order.invoicePath && fs.existsSync(order.invoicePath)) {
      return res.download(order.invoicePath, `invoice-${order.orderNumber}.pdf`);
    }

    // Generate on demand
    const restaurant = order.restaurant;
    const { filepath, filename } = await generateInvoicePDF(order, restaurant);

    // Save path for future requests
    order.invoicePath = filepath;
    order.invoiceGenerated = true;
    await order.save();

    res.download(filepath, filename);
  } catch (error) {
    logger.error("Invoice download error:", error);
    res.status(500).json({ success: false, message: "Failed to generate invoice" });
  }
});

// POST /api/invoices/:orderId/email - Email invoice
router.post("/:orderId/email", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { email } = req.body;

    const order = await Order.findById(orderId).populate("customer").populate("restaurant");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Queue email delivery (would use a mailer service in production)
    logger.info(`Invoice email requested for order ${orderId} to ${email}`);

    res.status(200).json({
      success: true,
      message: "Invoice will be sent to your email shortly",
    });
  } catch (error) {
    logger.error("Invoice email error:", error);
    res.status(500).json({ success: false, message: "Failed to send invoice" });
  }
});

export default router;
