# DineFlow Pro - Restaurant QR Ordering SaaS

## 🚀 Production-Ready QR Code Based Restaurant Ordering Platform

DineFlow Pro is an enterprise-grade SaaS platform that revolutionizes restaurant table ordering through intelligent QR code scanning and real-time order management.

### ✨ Key Features

#### Customer Features
- **QR Code Ordering**: Scan unique table QR codes to open personalized ordering interface
- **Smart Menu Discovery**: Browse, search, and filter menu items with high-quality images
- **Shopping Cart**: Add/remove items, manage quantities, and add special instructions
- **Payment Gateway**: Razorpay integration with UPI, credit/debit card, and wallet support
- **Order Tracking**: Real-time order status updates (Pending → Accepted → Preparing → Ready → Delivered)
- **Order History**: Automatic customer recognition with personalized greeting
- **Smart Recommendations**: AI-powered menu suggestions based on purchase patterns
- **Invoice Management**: PDF generation and WhatsApp sharing
- **Multi-Language Support**: English and Hindi with i18n
- **Dark Mode**: Premium glassmorphism design

#### Admin Dashboard
- **Analytics Dashboard**: Revenue, top-selling items, peak hours, customer retention
- **Order Management**: Live incoming orders with accept/reject functionality
- **Menu Management**: CRUD operations with image upload and availability toggle
- **Offer Management**: Coupon system and promotion engine
- **Kitchen Display**: Real-time kitchen orders with priority highlighting
- **Staff Management**: Role-based access control
- **Restaurant Settings**: Multi-tenant configuration

#### Real-Time Features
- **Socket.io Integration**: Instant notifications across customer, admin, and kitchen
- **Live Kitchen Display**: Real-time order updates visible to kitchen staff
- **Payment Status**: Immediate payment confirmation and failure notifications

### 🏗️ Tech Stack

**Frontend:**
- React 18 + Vite
- TailwindCSS + Framer Motion
- React Router v6
- Zustand for state management
- React Query for server state
- Socket.io-client for real-time
- Recharts for analytics
- Zod for validation
- i18next for internationalization

**Backend:**
- Node.js + Express.js
- Socket.io for real-time communication
- MongoDB Atlas for database
- Redis for caching
- BullMQ for job queues
- JWT for authentication
- Razorpay for payments
- Cloudinary for media storage

**DevOps:**
- Docker & Docker Compose
- GitHub Actions CI/CD
- Nginx reverse proxy
- Health check endpoints
- Monitoring-ready setup

### 📁 Project Structure

```
dineflow-pro/
├── server/                    # Backend Express.js application
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── models/           # MongoDB models
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── socket/           # Socket.io handlers
│   │   ├── queues/           # BullMQ queue definitions
│   │   ├── workers/          # Queue job workers
│   │   ├── utils/            # Utility functions
│   │   ├── constants/        # Constants
│   │   ├── tests/            # Unit tests
│   │   ├── app.js            # Express app setup
│   │   └── index.js          # Server entry point
│   ├── .env.example          # Environment template
│   ├── .dockerignore         # Docker ignore
│   ├── Dockerfile           # Production Docker image
│   ├── docker-compose.yml   # Local development
│   ├── package.json         # Dependencies
│   └── .eslintrc.json       # Linting rules
│
├── client/                    # React frontend application
│   ├── src/
│   │   ├── pages/            # Route components
│   │   ├── components/       # Reusable components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Zustand store
│   │   ├── services/         # API & Socket services
│   │   ├── context/          # React Context
│   │   ├── utils/            # Utilities
│   │   ├── constants/        # Constants
│   │   ├── translations/     # i18n files
│   │   ├── styles/           # Global styles
│   │   ├── App.jsx           # Root component
│   │   └── main.jsx          # Entry point
│   ├── public/               # Static assets
│   ├── .env.example          # Environment template
│   ├── vite.config.js        # Vite configuration
│   ├── tailwind.config.js    # TailwindCSS config
│   ├── package.json          # Dependencies
│   └── .eslintrc.json        # Linting rules
│
├── docker-compose.yml        # Full stack local development
├── nginx.conf               # Nginx configuration
├── .github/workflows/       # CI/CD pipelines
├── docs/                    # Documentation
└── DEPLOYMENT.md            # Deployment guide
```

### 🚀 Quick Start

#### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Redis (local or cloud)
- Razorpay account
- Cloudinary account

#### Local Development

```bash
# Clone repository
git clone https://github.com/adityasrivastava2123-commits/dineflow5.git
cd dineflow5

# Start with Docker Compose (recommended)
docker-compose up

# Or manual setup
# Backend
cd server
cp .env.example .env
npm install
npm run dev

# Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev
```

Application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Admin Panel: http://localhost:5173/admin
- Kitchen Display: http://localhost:5173/kitchen

### 📚 Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guides for:
- MongoDB Atlas Setup
- Redis Cloud Configuration
- Razorpay Integration
- Cloudinary Setup
- Vercel Frontend Deployment
- Render/Railway Backend Deployment

### 🔒 Security Features

- JWT-based authentication with refresh tokens
- Role-Based Access Control (RBAC)
- Helmet.js for HTTP security headers
- Rate limiting on API endpoints
- Input validation with Joi
- CORS protection
- XSS prevention
- CSRF tokens
- Tenant isolation in multi-tenant setup
- Audit logging for sensitive operations
- Environment variable protection

### 📊 Architecture

**Multi-Tenant SaaS Architecture:**
- Isolated restaurant data per tenant
- Shared infrastructure with separated contexts
- Tenant middleware for automatic isolation
- Redis caching per tenant

**Real-Time Communication:**
- Socket.io rooms for restaurant, admin, kitchen, and customer
- Event-driven updates
- Automatic reconnection handling

**Queue System:**
- Invoice generation queue
- WhatsApp notification queue
- Analytics processing queue
- Email notification queue

### 🔄 API Endpoints

**Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

**Menu Management**
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create menu item (admin)
- `PATCH /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item
- `GET /api/menu/category/:category` - Get items by category

**Orders**
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/admin/all` - Get all restaurant orders
- `PATCH /api/orders/:id` - Update order status
- `GET /api/orders/:id` - Get order details

**Payments**
- `POST /api/payments/create` - Create Razorpay order
- `POST /api/payments/webhook` - Razorpay webhook handler
- `GET /api/payments/:orderId` - Get payment status

**Analytics**
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/revenue` - Revenue data
- `GET /api/analytics/top-items` - Top selling items
- `GET /api/analytics/peak-hours` - Peak order times

**Offers**
- `GET /api/offers` - Get active offers
- `POST /api/offers` - Create offer (admin)
- `PATCH /api/offers/:id` - Update offer
- `POST /api/offers/validate` - Validate coupon code

### 🧪 Testing

```bash
# Backend tests
cd server
npm run test

# Frontend tests
cd client
npm run test
```

### 📈 Monitoring

- Health check endpoint: `GET /api/health`
- Readiness probe: `GET /api/ready`
- Liveness probe: `GET /api/live`
- Performance metrics available on admin dashboard

### 🤝 Contributing

See CONTRIBUTING.md for guidelines.

### 📄 License

MIT License - See LICENSE.md

### 📞 Support

For issues and feature requests, please use GitHub Issues.

---

**Built with ❤️ for modern restaurants**
"# Dineflow-Max" 
