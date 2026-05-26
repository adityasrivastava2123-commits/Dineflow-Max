const router = require('express').Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { LoyaltyAccount, Coupon } = require('../models/index');
const { auth, requireRole } = require('../middleware/auth');
const { sendWhatsApp } = require('../services/whatsapp');

// POST /api/orders - Place new order
router.post('/', async (req, res) => {
  try {
    const {
      restaurantId, tableNumber, items, customerName, customerPhone,
      paymentMethod, tipAmount, offerCode, loyaltyPointsUsed, notes,
      isScheduled, scheduledFor
    } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    // Check subscription
    if (restaurant.subscription.status !== 'active' || restaurant.subscription.expiresAt < new Date()) {
      return res.status(403).json({ message: 'Restaurant subscription expired' });
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      const itemPrice = item.portion?.price || item.price;
      const addonsTotal = (item.addons || []).reduce((sum, a) => sum + a.price, 0);
      subtotal += (itemPrice + addonsTotal) * item.quantity;
    }

    // Happy hours discount
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let happyHoursDiscount = 0;
    if (restaurant.settings.happyHours?.enabled) {
      const { startTime, endTime, discountPercent } = restaurant.settings.happyHours;
      if (currentTime >= startTime && currentTime <= endTime) {
        happyHoursDiscount = (subtotal * discountPercent) / 100;
      }
    }

    // Coupon discount
    let discountAmount = happyHoursDiscount;
    let appliedCoupon = null;
    if (offerCode) {
      const coupon = await Coupon.findOne({
        restaurantId, code: offerCode.toUpperCase(), isActive: true,
        validFrom: { $lte: now }, validTo: { $gte: now }
      });
      if (coupon && subtotal >= coupon.minOrderAmount) {
        if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
          const couponDisc = coupon.type === 'percent'
            ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
            : coupon.value;
          discountAmount += couponDisc;
          appliedCoupon = coupon;
        }
      }
    }

    // Loyalty points discount
    let loyaltyDiscount = 0;
    if (loyaltyPointsUsed > 0) {
      const loyalty = await LoyaltyAccount.findOne({ phone: customerPhone, restaurantId });
      if (loyalty && loyalty.points >= loyaltyPointsUsed) {
        loyaltyDiscount = loyaltyPointsUsed; // 1 point = ₹1
        discountAmount += loyaltyDiscount;
      }
    }

    const taxAmount = ((subtotal - discountAmount) * restaurant.taxRate) / 100;
    const serviceCharge = restaurant.serviceCharge > 0
      ? ((subtotal - discountAmount) * restaurant.serviceCharge) / 100 : 0;
    const totalAmount = subtotal - discountAmount + taxAmount + serviceCharge + (tipAmount || 0);

    // Loyalty points to earn
    const pointsEarned = Math.floor(totalAmount / 10);

    const estimatedReadyAt = new Date(Date.now() + (restaurant.settings.estimatedPrepTime || 20) * 60 * 1000);

    const order = await Order.create({
      restaurantId, tableNumber, items, customerName, customerPhone,
      paymentMethod, tipAmount: tipAmount || 0, offerCode,
      loyaltyPointsUsed: loyaltyPointsUsed || 0,
      loyaltyPointsEarned: pointsEarned,
      notes, isScheduled, scheduledFor,
      subtotal, taxAmount, discountAmount, totalAmount, estimatedReadyAt,
      statusHistory: [{ status: 'pending', timestamp: new Date() }]
    });

    // Update coupon usage
    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      await appliedCoupon.save();
    }

    // Deduct loyalty points used
    if (loyaltyPointsUsed > 0) {
      await LoyaltyAccount.findOneAndUpdate(
        { phone: customerPhone, restaurantId },
        {
          $inc: { points: -loyaltyPointsUsed, totalRedeemed: loyaltyPointsUsed },
          $push: { transactions: { type: 'redeem', points: -loyaltyPointsUsed, orderId: order._id, description: 'Redeemed at checkout' } }
        }
      );
    }

    // Mark table as occupied
    if (tableNumber) {
      await Restaurant.updateOne(
        { _id: restaurantId, 'tables.number': tableNumber },
        { $set: { 'tables.$.isOccupied': true, 'tables.$.currentOrderId': order._id } }
      );
    }

    // Socket.io notifications
    const io = req.app.get('io');
    io.to(`restaurant-${restaurantId}`).emit('new-order', order);
    io.to(`kitchen-${restaurantId}`).emit('new-order', order);

    // WhatsApp notification to restaurant
    if (restaurant.whatsappNumber && restaurant.callMeBotApiKey) {
      const msg = `🔔 New Order #${order.orderNumber}\nTable: ${tableNumber || 'Takeaway'}\nCustomer: ${customerName}\nItems: ${items.map(i => `${i.name} x${i.quantity}`).join(', ')}\nTotal: ₹${totalAmount.toFixed(2)}`;
      sendWhatsApp(restaurant.whatsappNumber, restaurant.callMeBotApiKey, msg).catch(console.error);
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders - Get orders (admin/manager)
router.get('/', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const { status, date, page = 1, limit = 50 } = req.query;
    const restaurantId = req.user.restaurantId;

    let query = { restaurantId };
    if (status) query.status = status;
    if (date) {
      const d = new Date(date);
      query.createdAt = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);
    res.json({ orders, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/kitchen/live - Live orders for kitchen
router.get('/kitchen/live', auth, requireRole('admin', 'manager', 'kitchen', 'superadmin'), async (req, res) => {
  try {
    const orders = await Order.find({
      restaurantId: req.user.restaurantId,
      status: { $in: ['pending', 'accepted', 'preparing', 'ready'] }
    }).sort({ createdAt: 1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('restaurantId', 'name logo phone address GSTIN taxRate branding');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', auth, requireRole('admin', 'manager', 'kitchen', 'superadmin'), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('restaurantId');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const oldStatus = order.status;
    order.status = status;
    order.statusHistory.push({ status, timestamp: new Date(), updatedBy: req.user._id });

    // If delivered: credit loyalty points
    if (status === 'delivered' && order.paymentStatus === 'paid') {
      await LoyaltyAccount.findOneAndUpdate(
        { phone: order.customerPhone, restaurantId: order.restaurantId },
        {
          $inc: { points: order.loyaltyPointsEarned, totalEarned: order.loyaltyPointsEarned },
          $push: { transactions: { type: 'earn', points: order.loyaltyPointsEarned, orderId: order._id, description: 'Order completed' } }
        },
        { upsert: true }
      );

      // Free table
      if (order.tableNumber) {
        await Restaurant.updateOne(
          { _id: order.restaurantId, 'tables.number': order.tableNumber },
          { $set: { 'tables.$.isOccupied': false, 'tables.$.currentOrderId': null } }
        );
      }
    }

    await order.save();

    const io = req.app.get('io');
    io.to(`restaurant-${order.restaurantId._id}`).emit('order-updated', order);
    io.to(`kitchen-${order.restaurantId._id}`).emit('order-updated', order);
    io.to(`order-${order._id}`).emit('status-update', { status, orderId: order._id });

    // WhatsApp to customer when ready
    if (status === 'ready' && order.restaurantId.whatsappNumber) {
      const msg = `✅ Your order #${order.orderNumber} at ${order.restaurantId.name} is READY!\nPlease collect from the counter.`;
      sendWhatsApp(order.customerPhone, order.restaurantId.callMeBotApiKey, msg).catch(console.error);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/customer/history?phone=&restaurantId=
router.get('/customer/history', async (req, res) => {
  try {
    const { phone, restaurantId } = req.query;
    const orders = await Order.find({ customerPhone: phone, restaurantId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/orders/:id/cancel
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!['pending', 'accepted'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel order in current status' });
    }
    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), updatedBy: req.user?._id });
    await order.save();

    const io = req.app.get('io');
    io.to(`restaurant-${order.restaurantId}`).emit('order-updated', order);
    io.to(`order-${order._id}`).emit('status-update', { status: 'cancelled' });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
