import { Link } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, BarChart3, ChefHat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminApp() {
  const { user } = useAuth();
  const quick = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', color: 'bg-orange-50 text-orange-600' },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Orders', color: 'bg-blue-50 text-blue-600' },
    { to: '/admin/menu', icon: UtensilsCrossed, label: 'Menu', color: 'bg-emerald-50 text-emerald-600' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics', color: 'bg-purple-50 text-purple-600' },
    { to: '/kitchen', icon: ChefHat, label: 'Kitchen', color: 'bg-red-50 text-red-600' },
  ];
  return (
    <div className="min-h-screen bg-stone-50 p-4">
      <div className="mb-6">
        <div className="font-display font-black text-2xl text-stone-900">DineFlow Admin</div>
        <div className="text-stone-500 text-sm">Welcome, {user?.name}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {quick.map(item => (
          <Link key={item.to} to={item.to} className="card-hover flex flex-col items-center justify-center py-6 gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <span className="font-semibold text-stone-800 text-sm">{item.label}</span>
          </Link>
        ))}
      </div>
      <div className="mt-4">
        <Link to="/admin" className="btn-primary w-full py-3 justify-center">Open Full Admin Panel</Link>
      </div>
    </div>
  );
}
