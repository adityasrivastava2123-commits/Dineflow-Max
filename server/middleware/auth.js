const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dineflow_secret_2024');
    const user = await User.findById(decoded.userId).populate('restaurantId');
    if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid or expired token' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

const requireRestaurant = (req, res, next) => {
  if (req.user.role !== 'superadmin' && !req.user.restaurantId) {
    return res.status(403).json({ message: 'No restaurant associated' });
  }
  next();
};

module.exports = { auth, requireRole, requireRestaurant };
