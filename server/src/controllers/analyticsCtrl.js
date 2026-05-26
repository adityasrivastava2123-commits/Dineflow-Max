import Analytics from "../models/Analytics.js";
import Order from "../models/Order.js";
import logger from "../utils/logger.js";

export const getDashboardMetrics = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.find({
      restaurant: restaurantId,
      createdAt: { $gte: today },
    });

    const totalRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const activeOrders = await Order.countDocuments({
      restaurant: restaurantId,
      status: { $in: ["pending", "accepted", "preparing"] },
    });

    const averageOrderValue = todayOrders.length > 0 ? totalRevenue / todayOrders.length : 0;

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalOrders: todayOrders.length,
          totalRevenue,
          activeOrders,
          averageOrderValue: Math.round(averageOrderValue),
        },
      },
    });
  } catch (error) {
    logger.error("Get dashboard metrics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch metrics",
    });
  }
};

export const getRevenueAnalytics = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"];
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenueData = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          createdAt: { $gte: startDate },
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: { revenueData },
    });
  } catch (error) {
    logger.error("Get revenue analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue analytics",
    });
  }
};

export const getTopSellingItems = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"];
    const { limit = 10 } = req.query;

    const topItems = await Order.aggregate([
      {
        $match: { restaurant: restaurantId },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.menuItem",
          name: { $first: "$items.name" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.status(200).json({
      success: true,
      data: { topItems },
    });
  } catch (error) {
    logger.error("Get top items error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top items",
    });
  }
};

export const getPeakHours = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"];

    const peakHours = await Order.aggregate([
      {
        $match: { restaurant: restaurantId },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: { peakHours },
    });
  } catch (error) {
    logger.error("Get peak hours error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch peak hours",
    });
  }
};

export const getCustomerMetrics = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"];

    const totalCustomers = await Order.distinct("customer", {
      restaurant: restaurantId,
    });

    const returningCustomers = await Order.aggregate([
      { $match: { restaurant: restaurantId } },
      { $group: { _id: "$customer", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: "total" },
    ]);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalCustomers: totalCustomers.length,
          returningCustomers: returningCustomers[0]?.total || 0,
          newCustomers: totalCustomers.length - (returningCustomers[0]?.total || 0),
        },
      },
    });
  } catch (error) {
    logger.error("Get customer metrics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer metrics",
    });
  }
};
