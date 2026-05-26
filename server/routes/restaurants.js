const router = require('express').Router();
const Restaurant = require('../models/Restaurant');
const QRCode = require('qrcode');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/restaurants/:slug - Public profile
router.get('/:slug', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug, isActive: true })
      .select('-callMeBotApiKey -whatsappNumber');
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/restaurants/admin/details
router.get('/admin/details', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/restaurants/ - Update restaurant
router.put('/', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.user.restaurantId || req.body.restaurantId,
      req.body, { new: true }
    );
    res.json(restaurant);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/restaurants/tables - Add table
router.post('/tables', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const { number, capacity, section } = req.body;
    const restaurant = await Restaurant.findById(req.user.restaurantId);

    const appUrl = process.env.CLIENT_URL || 'https://dineflow.app';
    const qrUrl = `${appUrl}/restaurant/${restaurant.slug}?table=${number}`;
    const qrCode = await QRCode.toDataURL(qrUrl);

    restaurant.tables.push({ number, capacity: capacity || 4, section, qrCode });
    await restaurant.save();
    res.json(restaurant);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/restaurants/tables/qrcodes - Get all QR codes
router.get('/tables/qrcodes', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    const appUrl = process.env.CLIENT_URL || 'https://dineflow.app';

    const qrs = await Promise.all(restaurant.tables.map(async (table) => {
      const url = `${appUrl}/restaurant/${restaurant.slug}?table=${table.number}`;
      const qrCode = table.qrCode || await QRCode.toDataURL(url);
      return { tableNumber: table.number, capacity: table.capacity, url, qrCode };
    }));

    res.json(qrs);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// PATCH /api/restaurants/tables/:number/status
router.patch('/tables/:number/status', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const { isOccupied } = req.body;
    const restaurant = await Restaurant.findOneAndUpdate(
      { _id: req.user.restaurantId, 'tables.number': req.params.number },
      { $set: { 'tables.$.isOccupied': isOccupied } },
      { new: true }
    );
    const io = req.app.get('io');
    io.to(`restaurant-${req.user.restaurantId}`).emit('table-update', restaurant.tables);
    res.json(restaurant);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
