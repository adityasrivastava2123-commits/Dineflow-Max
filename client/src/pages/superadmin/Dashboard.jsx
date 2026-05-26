import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, BarChart3, Store, Users, DollarSign, TrendingUp, LogOut, Settings, HeadphonesIcon } from 'lucide-react';
import { superadminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function SALayout({ children, title }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const nav = [
    { path: '/superadmin', icon: BarChart3, label: 'Dashboard' },
    { path: '/superadmin/restaurants', icon: Store, label: 'Restaurants' },
    { path: '/superadmin/support', icon: HeadphonesIcon, label: 'Support' },
  ];

  return (
    <div className="flex h-screen bg-stone-950 overflow-hidden">
      <aside className="w-56 flex flex-col border-r border-stone-800 flex-shrink-0">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-stone-800">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm">DineFlow</div>
            <div className="text-stone-500 text-[10px]">Super Admin</div>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {nav.map(item => (
            <Link key={item.path} to={item.path}
              className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-all mb-0.5">
              <item.icon className="w-4 h-4" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-800">
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl text-sm transition-all">
            <LogOut className="w-4 h-4" />Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-stone-900 border-b border-stone-800 flex items-center px-6">
          <h1 className="font-display font-bold text-white text-lg">{title}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-stone-950">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      superadminAPI.getStats(),
      superadminAPI.getRestaurants({ limit: 5 })
    ]).then(([s, r]) => {
      setStats(s.data);
      setRestaurants(r.data.restaurants);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const planColors = { trial: 'badge-stone', basic: 'badge-blue', standard: 'badge-orange', premium: 'badge-purple' };

  return (
    <SALayout title="Dashboard">
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Restaurants', value: stats?.totalRestaurants || 0, icon: Store, color: 'bg-blue-900 text-blue-400' },
              { label: 'Active Subscriptions', value: stats?.activeRestaurants || 0, icon: TrendingUp, color: 'bg-emerald-900 text-emerald-400' },
              { label: 'Monthly Revenue', value: `₹${(stats?.mrr || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'bg-brand-900 text-brand-400' },
              { label: 'Total Orders', value: stats?.totalOrders?.toLocaleString() || 0, icon: BarChart3, color: 'bg-purple-900 text-purple-400' },
            ].map((s, i) => (
              <div key={i} className="bg-stone-900 rounded-2xl border border-stone-800 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{s.label}</div>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.color}`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-2xl font-black text-white">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Plan distribution */}
          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-stone-900 rounded-2xl border border-stone-800 p-5">
              <div className="font-display font-bold text-white mb-4">Plan Distribution</div>
              <div className="space-y-3">
                {[
                  { key: 'premium', label: 'Premium', color: 'bg-purple-500' },
                  { key: 'standard', label: 'Standard', color: 'bg-brand-500' },
                  { key: 'basic', label: 'Basic', color: 'bg-blue-500' },
                  { key: 'trial', label: 'Trial', color: 'bg-stone-600' },
                ].map(p => {
                  const count = stats?.byPlan?.[p.key] || 0;
                  const total = stats?.totalRestaurants || 1;
                  return (
                    <div key={p.key} className="flex items-center gap-3">
                      <div className="w-20 text-xs font-semibold text-stone-400">{p.label}</div>
                      <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
                        <div className={`h-full ${p.color} rounded-full`} style={{ width: `${(count / total) * 100}%` }} />
                      </div>
                      <div className="w-6 text-xs font-bold text-white text-right">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-stone-900 rounded-2xl border border-stone-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="font-display font-bold text-white">Recent Restaurants</div>
                <Link to="/superadmin/restaurants" className="text-xs text-brand-400 hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {restaurants.map(r => (
                  <div key={r._id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-stone-800 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {r.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-semibold truncate">{r.name}</div>
                      <div className="text-stone-500 text-xs">{r.slug}</div>
                    </div>
                    <span className={`${planColors[r.subscription?.plan] || 'badge-stone'} text-[10px]`}>{r.subscription?.plan}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </SALayout>
  );
}
