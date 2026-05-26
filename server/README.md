# DineFlow Pro - Backend API

Restaurant QR Code Ordering System - Backend Server

## Setup

```bash
cd server
npm install
```

## Configuration

Create a `.env` file from `.env.example` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection URL
- `JWT_SECRET` - JWT signing secret
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` - Payment gateway credentials
- `CLOUDINARY_*` - Image storage credentials

## Running the Server

```bash
# Development
npm run dev

# Production
npm start

# Run tests
npm test
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Menu
- `GET /api/menu` - Get restaurant menu
- `GET /api/menu/categories` - Get menu categories
- `POST /api/menu` - Create menu item (admin)
- `PUT /api/menu/:id` - Update menu item (admin)
- `DELETE /api/menu/:id` - Delete menu item (admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status

### Payments
- `POST /api/payments/create` - Create payment
- `POST /api/payments/verify` - Verify payment

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/top-items` - Top selling items

### Offers
- `GET /api/offers` - Get active offers
- `POST /api/offers/validate` - Validate coupon

## Socket Events

- `join-restaurant` - Join restaurant channel
- `join-kitchen` - Join kitchen channel
- `order-placed` - Emit when order is placed
- `order-status-change` - Update order status
- `call-waiter` - Call waiter button
- `request-bill` - Request bill

## Database Models

- **User** - Users and staff members
- **Restaurant** - Restaurant details
- **MenuItem** - Menu items
- **Order** - Customer orders
- **Payment** - Payment records
- **Offer** - Promotional offers
- **Analytics** - Daily analytics data

## Project Structure

```
src/
├── config/          # Configuration files (DB, Redis, Payment)
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/          # MongoDB schemas
├── routes/          # API routes
├── socket/          # Socket.io handlers
├── utils/           # Utility functions
├── app.js           # Express app
└── index.js         # Server entry point
```

## License

MIT
