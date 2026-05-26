import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function CustomerOrderHistory() {
  const [phone, setPhone] = useState('');
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (phone.length < 10) { toast.error('Enter a valid phone number'); return; }
    setLoading(true);
    try {
      const res = await ordersAPI.getCustomerHistory(phone, restaurantSlug || undefined);
      setOrders(res.data);
      setSearched(true);
    } catch { toast.error('Failed to fetch history'); } finally { setLoading(false); }
  };

  const statusColor = { pending: 'status-pending', accepted: 'status-accepted', preparing: 'status-preparing', ready: 'status-ready', delivered: 'status-delivered', cancelled: 'status-cancelled' };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-stone-950 px-4 py-8 text-center">
        <h1 className="font-display font-black text-2xl text-white mb-1">Order History</h1>
        <p className="text-stone-400 text-sm">Enter your phone number to see past orders</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="card space-y-3">
          <div>
            <label className="label">Phone Number</label>
            <input className="input" type="tel" placeholder="Enter your phone number" value={phone} onChange={e => setPhone(e.target.value)} maxLength={10} />
          </div>
          <div>
            <label className="label">Restaurant (optional)</label>
            <input className="input" placeholder="Restaurant slug e.g. spice-garden" value={restaurantSlug} onChange={e => setRestaurantSlug(e.target.value)} />
          </div>
          <button onClick={handleSearch} disabled={loading} className="btn-primary w-full py-3">
            {loading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <><Search className="w-4 h-4" />Find Orders</>}
          </button>
        </div>

        {searched && (
          orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map(order => (
                <Link key={order._id} to={`/order/${order._id}`} className="card-hover flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center font-bold text-stone-600 text-sm flex-shrink-0">
                    {order.tableNumber || 'TK'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-stone-900 text-sm">#{order.orderNumber}</div>
                    <div className="text-xs text-stone-500">{order.items.length} items · {new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-stone-900 text-sm">₹{order.totalAmount?.toFixed(0)}</div>
                    <span className={statusColor[order.status] || 'badge-stone'}>{order.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-stone-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-stone-300" />
              <div className="font-semibold">No orders found</div>
              <div className="text-sm mt-1">No orders found for {phone}</div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
