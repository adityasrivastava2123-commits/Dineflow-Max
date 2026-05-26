const router = require('express').Router();
const { Review } = require('../models/index');
const MenuItem = require('../models/MenuItem');
const { auth, requireRole } = require('../middleware/auth');

router.post('/', async (req, res) => {
  try {
    const review = await Review.create(req.body);
    // Update menu item rating
    if (req.body.menuItemId) {
      const reviews = await Review.find({ menuItemId: req.body.menuItemId });
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await MenuItem.findByIdAndUpdate(req.body.menuItemId, {
        'ratings.average': Math.round(avg * 10) / 10,
        'ratings.count': reviews.length
      });
    }
    res.status(201).json(review);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const reviews = await Review.find({ restaurantId: req.params.restaurantId, isPublic: true })
      .sort({ createdAt: -1 }).limit(50);
    res.json(reviews);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/admin', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const reviews = await Review.find({ restaurantId: req.user.restaurantId }).sort({ createdAt: -1 });
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    res.json({ reviews, averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
