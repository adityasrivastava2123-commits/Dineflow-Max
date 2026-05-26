const router = require('express').Router();
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/menu/:slug - Public menu by restaurant slug
router.get('/:slug', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug, isActive: true });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let query = { restaurantId: restaurant._id, available: true };
    const menuItems = await MenuItem.find(query).sort({ sortOrder: 1, isBestseller: -1 });

    // Filter by current menu type based on time
    const filteredItems = menuItems.filter(item => {
      if (item.menuType === 'all') return true;
      if (item.menuSchedule?.startTime && item.menuSchedule?.endTime) {
        return currentTime >= item.menuSchedule.startTime && currentTime <= item.menuSchedule.endTime;
      }
      return true;
    });

    // Group by category
    const categories = [...new Set(filteredItems.map(i => i.category))];
    
    // Happy hours discount check
    let happyHoursActive = false;
    if (restaurant.settings.happyHours?.enabled) {
      const { startTime, endTime } = restaurant.settings.happyHours;
      happyHoursActive = currentTime >= startTime && currentTime <= endTime;
    }

    res.json({
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        logo: restaurant.logo,
        description: restaurant.description,
        phone: restaurant.phone,
        address: restaurant.address,
        taxRate: restaurant.taxRate,
        serviceCharge: restaurant.serviceCharge,
        settings: restaurant.settings,
        branding: restaurant.branding,
        rating: restaurant.rating,
        totalReviews: restaurant.totalReviews,
        happyHoursActive,
        happyHoursDiscount: restaurant.settings.happyHours?.discountPercent || 0
      },
      categories,
      items: filteredItems
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/menu - Create menu item (admin/manager)
router.post('/', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const item = await MenuItem.create({
      ...req.body,
      restaurantId: req.user.restaurantId || req.body.restaurantId
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/menu/:id
router.put('/:id', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      req.body,
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/menu/:id
router.delete('/:id', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    await MenuItem.findOneAndDelete({ _id: req.params.id, restaurantId: req.user.restaurantId });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/menu/:id/toggle - Toggle availability
router.patch('/:id/toggle', auth, requireRole('admin', 'manager', 'kitchen', 'superadmin'), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    item.available = !item.available;
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/menu/admin/all - All items for admin
router.get('/admin/all', auth, requireRole('admin', 'manager', 'superadmin'), async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId || req.query.restaurantId;
    const items = await MenuItem.find({ restaurantId }).sort({ category: 1, sortOrder: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
