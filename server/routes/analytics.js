// analytics.js
const router = require('express').Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { auth, requireRole } = require('../middleware/auth');

router.get('/dashboard', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayOrders, yesterdayOrders, weekOrders, allTodayOrders] = await Promise.all([
      Order.find({ restaurantId, createdAt: { $gte: today }, status: { $ne: 'cancelled' } }),
      Order.find({ restaurantId, createdAt: { $gte: yesterday, $lt: today }, status: { $ne: 'cancelled' } }),
      Order.find({ restaurantId, createdAt: { $gte: weekAgo }, status: { $ne: 'cancelled' } }),
      Order.find({ restaurantId, createdAt: { $gte: today } })
    ]);

    const todayRevenue = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
    const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + o.totalAmount, 0);
    const weekRevenue = weekOrders.reduce((s, o) => s + o.totalAmount, 0);
    const avgOrderValue = todayOrders.length ? todayRevenue / todayOrders.length : 0;

    const uniqueCustomers = new Set(todayOrders.map(o => o.customerPhone)).size;

    res.json({
      today: { revenue: todayRevenue, orders: todayOrders.length, avgOrderValue, customers: uniqueCustomers },
      yesterday: { revenue: yesterdayRevenue, orders: yesterdayOrders.length },
      week: { revenue: weekRevenue, orders: weekOrders.length },
      revenueChange: yesterdayRevenue ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1) : 0,
      statusBreakdown: {
        pending: allTodayOrders.filter(o => o.status === 'pending').length,
        preparing: allTodayOrders.filter(o => ['accepted','preparing'].includes(o.status)).length,
        ready: allTodayOrders.filter(o => o.status === 'ready').length,
        delivered: allTodayOrders.filter(o => o.status === 'delivered').length,
        cancelled: allTodayOrders.filter(o => o.status === 'cancelled').length
      }
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/top-items', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 86400000);

    const orders = await Order.find({ restaurantId, createdAt: { $gte: since }, status: { $ne: 'cancelled' } });
    const itemMap = {};
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.name;
        if (!itemMap[key]) itemMap[key] = { name: key, quantity: 0, revenue: 0 };
        itemMap[key].quantity += item.quantity;
        itemMap[key].revenue += item.price * item.quantity;
      }
    }
    const sorted = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    res.json(sorted);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/revenue-trend', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 86400000);

    const orders = await Order.find({ restaurantId, createdAt: { $gte: since }, status: { $ne: 'cancelled' } });

    const dailyData = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      dailyData[key] = { date: key, revenue: 0, orders: 0 };
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().split('T')[0];
      if (dailyData[key]) {
        dailyData[key].revenue += order.totalAmount;
        dailyData[key].orders += 1;
      }
    }

    res.json(Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/peak-hours', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const since = new Date(Date.now() - 30 * 86400000);
    const orders = await Order.find({ restaurantId, createdAt: { $gte: since } });

    const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));
    for (const order of orders) {
      const day = order.createdAt.getDay();
      const hour = order.createdAt.getHours();
      heatmap[day][hour]++;
    }
    res.json(heatmap);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
