import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag, Table2, Users2,
  Settings, BarChart3, Tag, Star, Package, HeadphonesIcon, CreditCard,
  ChefHat, Menu, X, LogOut, Bell, Users, ChevronRight, Wifi, WifiOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const NAV_ITEMS = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { path: '/admin/menu', icon: UtensilsCrossed, label: 'Menu' },
  { path: '/admin/tables', icon: Table2, label: 'Tables' },
  { path: '/admin/customers', icon: Users, label: 'Customers' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/admin/coupons', icon: Tag, label: 'Coupons' },
  { path: '/admin/reviews', icon: Star, label: 'Reviews' },
  { path: '/admin/inventory', icon: Package, label: 'Inventory' },
  { path: '/admin/staff', icon: Users2, label: 'Staff' },
  { path: '/admin/support', icon: HeadphonesIcon, label: 'Support' },
  { path: '/admin/subscription', icon: CreditCard, label: 'Subscription' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-stone-950 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-stone-800 flex-shrink-0">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-white text-lg">DineFlow</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          {NAV_ITEMS.map(item => (
            <Link key={item.path} to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                isActive(item.path, item.exact)
                  ? 'bg-brand-500 text-white shadow-warm'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-stone-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.name}</div>
              <div className="text-stone-500 text-xs capitalize">{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl text-sm transition-all">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-stone-100 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-stone-600">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <h1 className="font-display font-bold text-stone-900 text-lg">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {connected ? 'Live' : 'Offline'}
            </div>

            {/* Kitchen link */}
            <Link to="/kitchen"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-stone-950 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors">
              <ChefHat className="w-3.5 h-3.5" />
              Kitchen
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
