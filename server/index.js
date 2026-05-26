require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api/', limiter);

// Make io available in routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/support', require('./routes/support'));
app.use('/api/loyalty', require('./routes/loyalty'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/invoices', require('./routes/invoices'));

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-restaurant', (restaurantId) => {
    socket.join(`restaurant-${restaurantId}`);
    console.log(`Socket ${socket.id} joined restaurant-${restaurantId}`);
  });

  socket.on('join-kitchen', (restaurantId) => {
    socket.join(`kitchen-${restaurantId}`);
  });

  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Cron: Check subscription expiry daily
cron.schedule('0 9 * * *', async () => {
  const Restaurant = require('./models/Restaurant');
  const { sendWhatsApp } = require('./services/whatsapp');
  
  const expiringSoon = await Restaurant.find({
    'subscription.expiresAt': {
      $gte: new Date(),
      $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    'subscription.status': 'active'
  });

  for (const restaurant of expiringSoon) {
    const daysLeft = Math.ceil((restaurant.subscription.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    if (restaurant.whatsappNumber && restaurant.callMeBotApiKey) {
      await sendWhatsApp(
        restaurant.whatsappNumber,
        restaurant.callMeBotApiKey,
        `⚠️ DineFlow Alert: Your ${restaurant.subscription.plan} subscription expires in ${daysLeft} days. Renew now to avoid interruption.`
      );
    }
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dineflow')
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 DineFlow server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = { app, io };
