require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB ✓');

    // Create superadmin
    const existing = await User.findOne({ email: 'super@dineflow.app' });
    if (!existing) {
      await User.create({
        name: 'Super Admin',
        email: 'super@dineflow.app',
        password: 'Admin@123',
        role: 'superadmin'
      });
      console.log('SuperAdmin created ✓');
      console.log('  Email:    super@dineflow.app');
      console.log('  Password: Admin@123');
    } else {
      console.log('SuperAdmin already exists ✓');
    }

    // Create demo restaurant
    const existingRest = await Restaurant.findOne({ slug: 'demo-restaurant' });
    if (!existingRest) {
      const restaurant = await Restaurant.create({
        name: 'Demo Restaurant',
        slug: 'demo-restaurant',
        email: 'demo@dineflow.app',
        phone: '9876543210',
        description: 'A demo restaurant to test DineFlow',
        address: { street: '123 Main St', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
        taxRate: 5,
        tables: [1,2,3,4,5].map(n => ({ number: String(n), capacity: 4, section: 'Main' })),
        operatingHours: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
          .map(day => ({ day, open: '09:00', close: '22:00', isClosed: false })),
        subscription: {
          plan: 'premium',
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      });

      // Create admin for demo restaurant
      const adminExists = await User.findOne({ email: 'admin@demo.com' });
      if (!adminExists) {
        await User.create({
          name: 'Demo Admin',
          email: 'admin@demo.com',
          password: 'demo123',
          role: 'admin',
          restaurantId: restaurant._id
        });
      }

      // Create kitchen staff
      const kitchenExists = await User.findOne({ email: 'kitchen@demo.com' });
      if (!kitchenExists) {
        await User.create({
          name: 'Kitchen Staff',
          email: 'kitchen@demo.com',
          password: 'demo123',
          role: 'kitchen',
          restaurantId: restaurant._id
        });
      }

      console.log('Demo restaurant created ✓');
      console.log('  Slug:     demo-restaurant');
      console.log('  Admin:    admin@demo.com / demo123');
      console.log('  Kitchen:  kitchen@demo.com / demo123');
    } else {
      console.log('Demo restaurant already exists ✓');
    }

    console.log('\nAll done! You can now log in at /login');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
