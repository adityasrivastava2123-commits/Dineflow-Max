const router = require('express').Router();
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Order = require('../models/Order');
const { Subscription } = require('../models/index');
const { auth, requireRole } = require('../middleware/auth');
const QRCode = require('qrcode');

// All superadmin routes require auth + superadmin role
router.use(auth, requireRole('superadmin'));

// GET /api/superadmin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalRestaurants, activeRestaurants, totalOrders, subscriptions] = await Promise.all([
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ 'subscription.status': 'active', 'subscription.expiresAt': { $gte: new Date() } }),
      Order.countDocuments({ status: { $ne: 'cancelled' } }),
      Subscription.find({ status: 'active' })
    ]);

    const mrr = subscriptions.reduce((s, sub) => s + (sub.price || 0), 0);
    const byPlan = { trial: 0, basic: 0, standard: 0, premium: 0 };
    
    const restaurants = await Restaurant.find({});
    for (const r of restaurants) {
      if (byPlan[r.subscription.plan] !== undefined) byPlan[r.subscription.plan]++;
    }

    res.json({ totalRestaurants, activeRestaurants, totalOrders, mrr, byPlan });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/superadmin/restaurants
router.get('/restaurants', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    let query = {};
    if (search) query.name = { $regex: search, $options: 'i' };

    const restaurants = await Restaurant.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Restaurant.countDocuments(query);
    res.json({ restaurants, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/superadmin/restaurants
router.post('/restaurants', async (req, res) => {
  try {
    const { adminName, adminEmail, adminPassword, adminPhone, ...restaurantData } = req.body;
    
    const restaurant = await Restaurant.create({
      ...restaurantData,
      slug: restaurantData.slug || restaurantData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      tables: [1,2,3,4].map(n => ({ number: String(n), capacity: 4 })),
      operatingHours: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
        .map(day => ({ day, open: '09:00', close: '22:00', isClosed: false }))
    });

    if (adminEmail) {
      await User.create({
        name: adminName, email: adminEmail, password: adminPassword,
        phone: adminPhone, role: 'admin', restaurantId: restaurant._id
      });
    }

    res.status(201).json(restaurant);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/superadmin/restaurants/:id
router.put('/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(restaurant);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/superadmin/restaurants/:id
router.delete('/restaurants/:id', async (req, res) => {
  try {
    await Restaurant.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Restaurant deactivated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/superadmin/restaurants/:id/subscription
router.put('/restaurants/:id/subscription', async (req, res) => {
  try {
    const { plan, days, status } = req.body;
    const PRICES = { trial: 0, basic: 999, standard: 1999, premium: 3999 };
    const update = {};
    if (plan) { update['subscription.plan'] = plan; update['subscription.price'] = PRICES[plan] || 0; }
    if (days) update['subscription.expiresAt'] = new Date(Date.now() + days * 86400000);
    if (status) update['subscription.status'] = status;

    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    res.json(restaurant);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/superadmin/restaurants/:id/qrcodes
router.get('/restaurants/:id/qrcodes', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    const appUrl = process.env.CLIENT_URL || 'https://dineflow.app';
    const qrs = await Promise.all(restaurant.tables.map(async (table) => {
      const url = `${appUrl}/restaurant/${restaurant.slug}?table=${table.number}`;
      const qrCode = await QRCode.toDataURL(url);
      return { tableNumber: table.number, url, qrCode };
    }));
    res.json(qrs);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/superadmin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'customer' } })
      .populate('restaurantId', 'name slug')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
