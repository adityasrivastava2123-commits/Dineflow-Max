import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, ShoppingBag, Users, DollarSign, 
  Clock, ChefHat, Star, AlertTriangle, ArrowRight, Package
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import AdminLayout from '../../components/layout/AdminLayout';
import { analyticsAPI, ordersAPI, restaurantAPI, inventoryAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, change, icon: Icon, color, prefix = '' }) => {
  const positive = parseFloat(change) >= 0;
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">{label}</div>
          <div className="font-display text-2xl font-black text-stone-900">{prefix}{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {positive ? '+' : ''}{change}% vs yesterday
        </div>
      )}
    </div>
  );
};

const STATUS_COLORS = {
  pending: 'status-pending', accepted: 'status-accepted',
  preparing: 'status-preparing', ready: 'status-ready',
  delivered: 'status-delivered', cancelled: 'status-cancelled'
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { on, joinRoom } = useSocket();
  const [dashboard, setDashboard] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [dashRes, ordersRes, itemsRes, trendRes, stockRes, restRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        ordersAPI.getOrders({ limit: 8 }),
        analyticsAPI.getTopItems(7),
        analyticsAPI.getRevenueTrend(14),
        inventoryAPI.getLowStock().catch(() => ({ data: [] })),
        restaurantAPI.getAdminDetails()
      ]);
      setDashboard(dashRes.data);
      setRecentOrders(ordersRes.data.orders || []);
      setTopItems(itemsRes.data.slice(0, 5));
      setRevenueTrend(trendRes.data);
      setLowStock(stockRes.data);
      setRestaurant(restRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const restaurantId = user?.restaurantId?._id || user?.restaurantId;
    if (restaurantId) {
      joinRoom(restaurantId);
      const cleanup = on('new-order', (order) => {
        setRecentOrders(prev => [order, ...prev.slice(0, 7)]);
        setDashboard(prev => prev ? {
          ...prev,
          today: { ...prev.today, orders: prev.today.orders + 1, revenue: prev.today.revenue + order.totalAmount }
        } : prev);
        toast.success(`New order! Table ${order.tableNumber || 'Takeaway'}`, { icon: '🔔' });
      });
      return cleanup;
    }
  }, [user]);

  const subscription = restaurant?.subscription;
  const daysLeft = subscription?.expiresAt
    ? Math.ceil((new Date(subscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      {/* Subscription warning */}
      {daysLeft <= 7 && daysLeft > 0 && (
        <div className="mb-4 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-amber-800 text-sm">Subscription expiring in {daysLeft} days</div>
            <div className="text-amber-700 text-xs">Renew now to avoid service interruption</div>
          </div>
          <Link to="/admin/subscription" className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors">
            Renew
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Today's Revenue" prefix="₹"
          value={dashboard?.today?.revenue?.toFixed(0) || '0'}
          change={dashboard?.revenueChange}
          icon={DollarSign} color="bg-orange-50 text-orange-600"
        />
        <StatCard
          label="Orders Today"
          value={dashboard?.today?.orders || 0}
          icon={ShoppingBag} color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Avg Order Value" prefix="₹"
          value={dashboard?.today?.avgOrderValue?.toFixed(0) || '0'}
          icon={TrendingUp} color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Customers Today"
          value={dashboard?.today?.customers || 0}
          icon={Users} color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Order status row */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Pending', key: 'pending', color: 'text-amber-600 bg-amber-50' },
          { label: 'Cooking', key: 'preparing', color: 'text-orange-600 bg-orange-50' },
          { label: 'Ready', key: 'ready', color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Delivered', key: 'delivered', color: 'text-stone-600 bg-stone-100' },
          { label: 'Cancelled', key: 'cancelled', color: 'text-red-600 bg-red-50' },
        ].map(s => (
          <div key={s.key} className={`rounded-xl p-3 text-center ${s.color}`}>
            <div className="font-display text-2xl font-black">{dashboard?.statusBreakdown?.[s.key] || 0}</div>
            <div className="text-xs font-semibold mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Revenue trend */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-bold text-stone-900">Revenue (14 days)</div>
            <div className="font-display text-sm font-bold text-stone-500">₹{dashboard?.week?.revenue?.toFixed(0) || 0} this week</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueTrend} barSize={20}>
              <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip formatter={(v) => [`₹${v.toFixed(0)}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top items */}
        <div className="card">
          <div className="font-display font-bold text-stone-900 mb-4">Top Dishes (7 days)</div>
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-stone-100 rounded-lg flex items-center justify-center text-xs font-bold text-stone-600">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-stone-900 truncate">{item.name}</div>
                  <div className="text-xs text-stone-500">{item.quantity} orders</div>
                </div>
                <div className="text-xs font-bold text-stone-700">₹{item.revenue?.toFixed(0)}</div>
              </div>
            ))}
            {topItems.length === 0 && <div className="text-sm text-stone-400 text-center py-4">No orders yet</div>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-bold text-stone-900">Recent Orders</div>
            <Link to="/admin/orders" className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentOrders.map(order => (
              <div key={order._id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 font-bold text-xs flex-shrink-0">
                  {order.tableNumber || 'TK'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-stone-900 truncate">{order.customerName}</div>
                  <div className="text-xs text-stone-500">{order.items.length} items · #{order.orderNumber}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-stone-900">₹{order.totalAmount?.toFixed(0)}</div>
                  <span className={STATUS_COLORS[order.status] || 'badge-stone'}>{order.status}</span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && <div className="text-sm text-stone-400 text-center py-4">No orders today</div>}
          </div>
        </div>

        {/* Low stock */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-bold text-stone-900">Low Stock Alerts</div>
            <Link to="/admin/inventory" className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:underline">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {lowStock.length > 0 ? (
            <div className="space-y-2.5">
              {lowStock.slice(0, 6).map(item => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-stone-900">{item.name}</div>
                    <div className="text-xs text-stone-500">{item.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600">{item.currentStock}</div>
                    <div className="text-xs text-stone-400">Min: {item.minStock}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-stone-400">
              <Package className="w-8 h-8 mb-2 text-emerald-400" />
              <div className="text-sm">All stock levels are good</div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
