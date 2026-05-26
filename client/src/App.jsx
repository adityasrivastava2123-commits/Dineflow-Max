import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';

// Pages
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Customer
import CustomerMenu from './pages/customer/CustomerMenu';
import OrderTracking from './pages/customer/OrderTracking';
import CustomerOrderHistory from './pages/customer/OrderHistory';
import RestaurantProfile from './pages/customer/RestaurantProfile';
import Checkout from './pages/customer/Checkout';

// Kitchen
import KitchenDisplay from './pages/kitchen/KitchenDisplay';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminMenu from './pages/admin/MenuManagement';
import AdminOrders from './pages/admin/Orders';
import AdminTables from './pages/admin/Tables';
import AdminStaff from './pages/admin/Staff';
import AdminSettings from './pages/admin/Settings';
import AdminAnalytics from './pages/admin/Analytics';
import AdminCoupons from './pages/admin/Coupons';
import AdminReviews from './pages/admin/Reviews';
import AdminInventory from './pages/admin/Inventory';
import AdminSupport from './pages/admin/Support';
import AdminSubscription from './pages/admin/Subscription';
import AdminCustomers from './pages/admin/Customers';

// SuperAdmin
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SuperAdminRestaurants from './pages/superadmin/Restaurants';
import SuperAdminSupport from './pages/superadmin/Support';

// Mobile Apps
import KitchenApp from './pages/mobile/KitchenApp';
import AdminApp from './pages/mobile/AdminApp';
import SuperAdminApp from './pages/mobile/SuperAdminApp';

// Route guards
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AdminRoute = ({ children }) => (
  <ProtectedRoute roles={['admin', 'manager', 'superadmin']}>{children}</ProtectedRoute>
);
const KitchenRoute = ({ children }) => (
  <ProtectedRoute roles={['kitchen', 'admin', 'manager', 'superadmin']}>{children}</ProtectedRoute>
);
const SuperAdminRoute = ({ children }) => (
  <ProtectedRoute roles={['superadmin']}>{children}</ProtectedRoute>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: { fontFamily: 'Plus Jakarta Sans, sans-serif', borderRadius: '12px', fontSize: '14px' },
                success: { iconTheme: { primary: '#f97316', secondary: '#fff' } }
              }}
            />
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Customer */}
              <Route path="/restaurant/:slug" element={<CustomerMenu />} />
              <Route path="/r/:slug" element={<RestaurantProfile />} />
              <Route path="/order/:orderId" element={<OrderTracking />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders/history" element={<CustomerOrderHistory />} />

              {/* Kitchen */}
              <Route path="/kitchen" element={<KitchenRoute><KitchenDisplay /></KitchenRoute>} />

              {/* Admin Panel */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/menu" element={<AdminRoute><AdminMenu /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/admin/tables" element={<AdminRoute><AdminTables /></AdminRoute>} />
              <Route path="/admin/staff" element={<AdminRoute><AdminStaff /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
              <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
              <Route path="/admin/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
              <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
              <Route path="/admin/subscription" element={<AdminRoute><AdminSubscription /></AdminRoute>} />
              <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />

              {/* SuperAdmin */}
              <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
              <Route path="/superadmin/restaurants" element={<SuperAdminRoute><SuperAdminRestaurants /></SuperAdminRoute>} />
              <Route path="/superadmin/support" element={<SuperAdminRoute><SuperAdminSupport /></SuperAdminRoute>} />

              {/* Mobile PWA Apps */}
              <Route path="/kitchen-app" element={<KitchenRoute><KitchenApp /></KitchenRoute>} />
              <Route path="/admin-app" element={<AdminRoute><AdminApp /></AdminRoute>} />
              <Route path="/superadmin-app" element={<SuperAdminRoute><SuperAdminApp /></SuperAdminRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
