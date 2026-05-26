import { Link } from 'react-router-dom';
import { BarChart3, Store, HeadphonesIcon } from 'lucide-react';
export default function SuperAdminApp() {
  return (
    <div className="min-h-screen bg-stone-950 p-4">
      <div className="mb-6">
        <div className="font-display font-black text-2xl text-white">DineFlow SuperAdmin</div>
        <div className="text-stone-400 text-sm">Platform Management</div>
      </div>
      <div className="space-y-3">
        {[
          { to: '/superadmin', icon: BarChart3, label: 'Dashboard', sub: 'Revenue & stats' },
          { to: '/superadmin/restaurants', icon: Store, label: 'Restaurants', sub: 'Manage all restaurants' },
          { to: '/superadmin/support', icon: HeadphonesIcon, label: 'Support', sub: 'Customer tickets' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex items-center gap-4 hover:border-stone-700 transition-colors">
            <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center">
              <item.icon className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <div className="font-bold text-white">{item.label}</div>
              <div className="text-stone-500 text-xs">{item.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
