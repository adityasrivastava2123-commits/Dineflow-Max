const router = require('express').Router();
const { Coupon } = require('../models/index');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const coupons = await Coupon.find({ restaurantId: req.user.restaurantId }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const coupon = await Coupon.create({ ...req.body, restaurantId: req.user.restaurantId });
    res.status(201).json(coupon);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(coupon);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/coupons/validate
router.post('/validate', async (req, res) => {
  try {
    const { code, restaurantId, orderAmount } = req.body;
    const now = new Date();
    const coupon = await Coupon.findOne({
      restaurantId, code: code.toUpperCase(), isActive: true,
      validFrom: { $lte: now }, validTo: { $gte: now }
    });
    if (!coupon) return res.status(404).json({ valid: false, message: 'Invalid or expired coupon' });
    if (orderAmount < coupon.minOrderAmount) {
      return res.json({ valid: false, message: `Minimum order ₹${coupon.minOrderAmount} required` });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.json({ valid: false, message: 'Coupon usage limit reached' });
    }

    const discount = coupon.type === 'percent'
      ? Math.min((orderAmount * coupon.value) / 100, coupon.maxDiscount || Infinity)
      : coupon.value;

    res.json({ valid: true, coupon, discount });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
