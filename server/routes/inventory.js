const router = require('express').Router();
const { Inventory } = require('../models/index');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const items = await Inventory.find({ restaurantId: req.user.restaurantId }).sort({ name: 1 });
    res.json(items);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const item = await Inventory.create({ ...req.body, restaurantId: req.user.restaurantId });
    res.status(201).json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, { ...req.body, lastUpdated: new Date() }, { new: true });
    res.json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/:id/wastage', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $inc: { currentStock: -quantity }, $push: { wastage: { quantity, reason } }, lastUpdated: new Date() },
      { new: true }
    );
    res.json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/low-stock', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const items = await Inventory.find({
      restaurantId: req.user.restaurantId,
      $expr: { $lte: ['$currentStock', '$minStock'] }
    });
    res.json(items);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
