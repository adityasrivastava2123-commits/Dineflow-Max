import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";
import { generateOrderNumber, calculateOrderTotal, applyTax } from "../utils/orderUtils.js";

export const createOrder = async (req, res) => {
  try {
    const { items, tableNumber, notes, specialInstructions } = req.body;
    const customerId = req.user.id;
    const restaurantId = req.headers["x-restaurant-id"];

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    // Fetch menu items and calculate totals
    const menuItems = await MenuItem.find({
      _id: { $in: items.map((item) => item.menuItemId) },
    });

    const orderItems = items.map((item) => {
      const menuItem = menuItems.find((mi) => mi._id.toString() === item.menuItemId);
      if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`);

      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
        addons: item.addons || [],
      };
    });

    const subtotal = calculateOrderTotal(orderItems);
    const tax = applyTax(subtotal) - subtotal;
    const totalAmount = subtotal + tax;

    const order = new Order({
      orderNumber: generateOrderNumber(),
      customer: customerId,
      restaurant: restaurantId,
      tableNumber,
      items: orderItems,
      subtotal,
      tax,
      totalAmount,
      notes,
      specialInstructions,
    });

    await order.save();
    await order.populate("items.menuItem");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { order },
    });
  } catch (error) {
    logger.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { limit = 10, page = 1 } = req.query;

    const orders = await Order.find({ customer: customerId })
      .populate("items.menuItem")
      .populate("restaurant", "name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments({ customer: customerId });

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
        },
      },
    });
  } catch (error) {
    logger.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("items.menuItem")
      .populate("restaurant")
      .populate("payment");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    logger.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "accepted", "preparing", "ready", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        status,
        ...(status === "preparing" && { startedAt: new Date() }),
        ...(status === "delivered" && { deliveredAt: new Date() }),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Order status updated",
      data: { order },
    });
  } catch (error) {
    logger.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};

export const getRestaurantOrders = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"];
    const { status, limit = 50, page = 1 } = req.query;

    const query = { restaurant: restaurantId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate("customer", "name phone")
      .populate("items.menuItem")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
        },
      },
    });
  } catch (error) {
    logger.error("Get restaurant orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

export const getLiveOrders = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"] || req.user.restaurant;
    const orders = await Order.find({
      restaurant: restaurantId,
      status: { $in: ["pending", "accepted", "preparing", "ready"] },
    })
      .populate("customer", "name phone")
      .populate("items.menuItem")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: { orders } });
  } catch (error) {
    logger.error("Get live orders error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch live orders" });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!["pending"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
      });
    }

    order.status = "cancelled";
    await order.save();

    res.status(200).json({ success: true, message: "Order cancelled", data: { order } });
  } catch (error) {
    logger.error("Cancel order error:", error);
    res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
};

export const getCustomerHistory = async (req, res) => {
  try {
    const { phone, restaurantId } = req.query;
    if (!phone || !restaurantId) {
      return res.status(400).json({ success: false, message: "phone and restaurantId required" });
    }

    // Find orders by customer phone (via customer lookup)
    const customer = await User.findOne({ phone });

    if (!customer) {
      return res.status(200).json({ success: true, data: { orders: [] } });
    }

    const orders = await Order.find({
      customer: customer._id,
      restaurant: restaurantId,
    })
      .populate("items.menuItem")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, data: { orders, customer: { name: customer.name, phone: customer.phone } } });
  } catch (error) {
    logger.error("Get customer history error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
};
