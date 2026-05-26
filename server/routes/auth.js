const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { auth } = require('../middleware/auth');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'dineflow_secret_2024', { expiresIn: '30d' });

// POST /api/auth/register - Register restaurant admin
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, restaurantName, restaurantSlug } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const existingSlug = await Restaurant.findOne({ slug: restaurantSlug });
    if (existingSlug) return res.status(400).json({ message: 'Restaurant URL already taken' });

    const restaurant = await Restaurant.create({
      name: restaurantName,
      slug: restaurantSlug.toLowerCase().replace(/\s+/g, '-'),
      email,
      phone,
      tables: [
        { number: '1', capacity: 4 },
        { number: '2', capacity: 4 },
        { number: '3', capacity: 4 },
        { number: '4', capacity: 4 }
      ],
      operatingHours: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => ({
        day, open: '09:00', close: '22:00', isClosed: false
      }))
    });

    const user = await User.create({
      name, email, password, phone,
      role: 'admin',
      restaurantId: restaurant._id
    });

    const token = generateToken(user._id);
    res.status(201).json({ token, user: { id: user._id, name, email, role: 'admin', restaurantId: restaurant._id }, restaurant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('restaurantId');
    if (!user || !user.password) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId?._id,
        restaurant: user.restaurantId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/customer-identify - Customer enters name+phone
router.post('/customer-identify', async (req, res) => {
  try {
    const { name, phone, restaurantId } = req.body;
    
    let user = await User.findOne({ phone, restaurantId, role: 'customer' });
    if (!user) {
      user = await User.create({ name, phone, restaurantId, role: 'customer' });
    } else if (name) {
      user.name = name;
      await user.save();
    }

    const token = generateToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, phone, role: 'customer' } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('restaurantId');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/staff - Create staff member
router.post('/staff', auth, async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!['admin', 'manager'].includes(req.user.role) && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name, email, password, phone, role,
      restaurantId: req.user.restaurantId
    });

    res.status(201).json({ message: 'Staff created', user: { id: user._id, name, email, role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
