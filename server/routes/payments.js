const router = require('express').Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { Subscription } = require('../models/index');
const { auth, requireRole } = require('../middleware/auth');

const getRazorpay = () => {
  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder'
  });
};

const PLANS = {
  trial: { price: 0, days: 30 },
  basic: { price: 999, days: 30 },
  standard: { price: 1999, days: 30 },
  premium: { price: 3999, days: 30 }
};

// POST /api/payments/create-order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', orderId } = req.body;
    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: orderId,
      notes: { orderId }
    });
    res.json({ orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/payments/verify
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body).digest('hex');
    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
    const order = await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id
    }, { new: true });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/payments/subscription
router.post('/subscription', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { plan } = req.body;
    const planDetails = PLANS[plan];
    if (!planDetails) return res.status(400).json({ message: 'Invalid plan' });

    if (planDetails.price === 0) {
      const restaurant = await Restaurant.findByIdAndUpdate(
        req.user.restaurantId,
        {
          'subscription.plan': plan,
          'subscription.status': 'active',
          'subscription.expiresAt': new Date(Date.now() + planDetails.days * 86400000),
          'subscription.price': 0
        },
        { new: true }
      );
      return res.json({ success: true, restaurant });
    }

    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: planDetails.price * 100,
      currency: 'INR',
      receipt: `sub_${req.user.restaurantId}_${plan}`,
      notes: { plan, restaurantId: req.user.restaurantId.toString() }
    });
    res.json({ orderId: razorpayOrder.id, amount: razorpayOrder.amount, plan, planDetails });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/payments/subscription/verify
router.post('/subscription/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body).digest('hex');
    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
    const planDetails = PLANS[plan];
    const expiresAt = new Date(Date.now() + planDetails.days * 86400000);
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.user.restaurantId,
      {
        'subscription.plan': plan,
        'subscription.status': 'active',
        'subscription.expiresAt': expiresAt,
        'subscription.price': planDetails.price
      },
      { new: true }
    );
    await Subscription.create({
      restaurantId: req.user.restaurantId,
      plan, price: planDetails.price,
      startDate: new Date(),
      endDate: expiresAt,
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      status: 'active'
    });
    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/payments/refund
router.post('/refund', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const order = await Order.findById(orderId);
    if (!order || !order.razorpayPaymentId) {
      return res.status(400).json({ message: 'No payment to refund' });
    }
    const razorpay = getRazorpay();
    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: amount ? Math.round(amount * 100) : undefined
    });
    order.paymentStatus = 'refunded';
    order.refundId = refund.id;
    order.refundAmount = (refund.amount / 100);
    await order.save();
    res.json({ success: true, refund });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
