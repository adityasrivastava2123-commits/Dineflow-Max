import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { loyaltyAPI, ordersAPI } from '../../services/api';
import { Users, Gift, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCustomers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loyaltyAPI.getMembers().then(r => setMembers(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const viewHistory = async (member) => {
    setSelected(member);
    try {
      const res = await ordersAPI.getCustomerHistory(member.phone, member.restaurantId);
      setOrders(res.data || []);
    } catch { setOrders([]); }
  };

  return (
    <AdminLayout title="Customers & Loyalty">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center"><div className="font-display text-2xl font-black text-stone-900">{members.length}</div><div className="text-xs text-stone-500">Loyalty Members</div></div>
        <div className="card text-center"><div className="font-display text-2xl font-black text-purple-600">{members.reduce((s, m) => s + (m.points || 0), 0)}</div><div className="text-xs text-stone-500">Total Points</div></div>
        <div className="card text-center"><div className="font-display text-2xl font-black text-emerald-600">₹{members.reduce((s, m) => s + (m.totalEarned || 0), 0)}</div><div className="text-xs text-stone-500">Total Earned</div></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-2 overflow-y-auto max-h-[600px]">
          {loading ? [1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />) :
            members.map(m => (
              <div key={m._id} onClick={() => viewHistory(m)}
                className={`card cursor-pointer hover:shadow-md transition-all ${selected?._id === m._id ? 'border-brand-300 bg-brand-50/30' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center font-bold text-purple-700">
                    {m.phone?.slice(-2)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-stone-900 text-sm flex items-center gap-2">
                      <Phone className="w-3 h-3 text-stone-400" />{m.phone}
                    </div>
                    <div className="text-xs text-stone-500">Earned: {m.totalEarned} pts · Redeemed: {m.totalRedeemed} pts</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-700 flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" />{m.points}
                    </div>
                    <div className="text-xs text-stone-400">points</div>
                  </div>
                </div>
              </div>
            ))
          }
          {!loading && members.length === 0 && (
            <div className="text-center py-16 text-stone-400">
              <Users className="w-10 h-10 mx-auto mb-3 text-stone-300" />
              <div className="font-semibold">No loyalty members yet</div>
              <div className="text-sm mt-1">Customers earn points when they order</div>
            </div>
          )}
        </div>

        <div>
          {selected ? (
            <div className="card">
              <div className="font-display font-bold text-stone-900 mb-3">Order History: {selected.phone}</div>
              <div className="space-y-2">
                {orders.map(o => (
                  <div key={o._id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-stone-900">#{o.orderNumber}</div>
                      <div className="text-xs text-stone-400">{new Date(o.createdAt).toLocaleDateString('en-IN')} · {o.items.length} items</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-stone-900 text-sm">₹{o.totalAmount?.toFixed(0)}</div>
                      <div className={`text-xs font-semibold ${o.status === 'delivered' ? 'text-emerald-600' : 'text-stone-400'}`}>{o.status}</div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <div className="text-stone-400 text-sm text-center py-4">No orders found</div>}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="text-stone-400 text-sm">Select a customer to view order history</div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
