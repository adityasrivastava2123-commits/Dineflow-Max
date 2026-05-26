const router = require('express').Router();
const { LoyaltyAccount } = require('../models/index');
const { auth, requireRole } = require('../middleware/auth');

router.get('/:phone', async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const account = await LoyaltyAccount.findOne({ phone: req.params.phone, restaurantId });
    res.json(account || { phone: req.params.phone, points: 0, totalEarned: 0, transactions: [] });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/earn', async (req, res) => {
  try {
    const { phone, restaurantId, points, orderId } = req.body;
    const account = await LoyaltyAccount.findOneAndUpdate(
      { phone, restaurantId },
      { $inc: { points, totalEarned: points }, $push: { transactions: { type: 'earn', points, orderId } } },
      { upsert: true, new: true }
    );
    res.json(account);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/redeem', async (req, res) => {
  try {
    const { phone, restaurantId, points } = req.body;
    const account = await LoyaltyAccount.findOne({ phone, restaurantId });
    if (!account || account.points < points) {
      return res.status(400).json({ message: 'Insufficient points' });
    }
    account.points -= points;
    account.totalRedeemed += points;
    account.transactions.push({ type: 'redeem', points: -points });
    await account.save();
    res.json(account);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/admin/members', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const members = await LoyaltyAccount.find({ restaurantId: req.user.restaurantId }).sort({ points: -1 });
    res.json(members);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
