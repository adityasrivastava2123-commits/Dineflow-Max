import { useState, useEffect } from 'react';
import { Search, Filter, Eye, RefreshCw, Download } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { ordersAPI, paymentsAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const STATUS_OPTIONS = ['all','pending','accepted','preparing','ready','delivered','cancelled'];
const STATUS_NEXT = { pending: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'delivered' };
const STATUS_LABEL_MAP = { pending: 'Accept', accepted: 'Start Cooking', preparing: 'Ready', ready: 'Delivered' };

const statusClass = {
  pending: 'status-pending', accepted: 'status-accepted', preparing: 'status-preparing',
  ready: 'status-ready', delivered: 'status-delivered', cancelled: 'status-cancelled'
};

function OrderDetail({ order, onClose, onStatusChange }) {
  const [updating, setUpdating] = useState(false);
  const nextStatus = STATUS_NEXT[order.status];

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await ordersAPI.updateStatus(order._id, status);
      onStatusChange(order._id, status);
      toast.success(`Order ${status}`);
    } catch { toast.error('Failed to update'); }
    finally { setUpdating(false); }
  };

  const handleRefund = async () => {
    if (!confirm('Refund this order?')) return;
    try {
      await paymentsAPI.refund({ orderId: order._id });
      toast.success('Refund initiated');
    } catch { toast.error('Refund failed'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-up">
        <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg">Order #{order.orderNumber}</h2>
            <span className={statusClass[order.status]}>{order.status}</span>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-stone-400 text-xs">Customer</div><div className="font-semibold">{order.customerName}</div></div>
            <div><div className="text-stone-400 text-xs">Phone</div><div className="font-semibold">{order.customerPhone}</div></div>
            <div><div className="text-stone-400 text-xs">Table</div><div className="font-semibold">{order.tableNumber || 'Takeaway'}</div></div>
            <div><div className="text-stone-400 text-xs">Time</div><div className="font-semibold">{new Date(order.createdAt).toLocaleTimeString('en-IN')}</div></div>
          </div>

          <div className="border-t border-stone-100 pt-3">
            <div className="font-semibold text-stone-700 mb-2 text-sm">Items</div>
            <div className="space-y-1.5">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-stone-500 w-5">{item.quantity}x</span>
                  <span className="flex-1">{item.name}{item.portion?.size ? ` (${item.portion.size})` : ''}</span>
                  <span className="font-semibold">₹{((item.price + (item.addons || []).reduce((s, a) => s + a.price, 0)) * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-100 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-stone-500"><span>Subtotal</span><span>₹{order.subtotal?.toFixed(0)}</span></div>
            {order.discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{order.discountAmount?.toFixed(0)}</span></div>}
            <div className="flex justify-between text-stone-500"><span>Tax</span><span>₹{order.taxAmount?.toFixed(0)}</span></div>
            {order.tipAmount > 0 && <div className="flex justify-between text-stone-500"><span>Tip</span><span>₹{order.tipAmount?.toFixed(0)}</span></div>}
            <div className="flex justify-between font-bold text-stone-900 text-base pt-1 border-t border-stone-100">
              <span>Total</span><span>₹{order.totalAmount?.toFixed(0)}</span>
            </div>
            <div className={`text-xs font-semibold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {order.paymentStatus?.toUpperCase()} · {order.paymentMethod?.toUpperCase()}
            </div>
          </div>

          {order.notes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              📋 {order.notes}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {nextStatus && (
              <button onClick={() => updateStatus(nextStatus)} disabled={updating} className="btn-primary flex-1">
                {updating ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : STATUS_LABEL_MAP[order.status]}
              </button>
            )}
            {!['cancelled'].includes(order.status) && order.status !== 'delivered' && (
              <button onClick={() => updateStatus('cancelled')} className="btn-danger px-4">Cancel</button>
            )}
            {order.paymentStatus === 'paid' && order.razorpayPaymentId && (
              <button onClick={handleRefund} className="btn-secondary px-4">Refund</button>
            )}
            <a href={`/api/invoices/order/${order._id}`} target="_blank" rel="noopener noreferrer"
              className="btn-secondary px-4">Invoice</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { on, joinRoom } = useSocket();
  const { user } = useAuth();

  const loadOrders = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const res = await ordersAPI.getOrders(params);
      setOrders(res.data.orders || []);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadOrders();
    const restaurantId = user?.restaurantId?._id || user?.restaurantId;
    if (restaurantId) {
      joinRoom(restaurantId);
      const cu = on('new-order', order => setOrders(prev => [order, ...prev]));
      const cu2 = on('order-updated', updated => setOrders(prev => prev.map(o => o._id === updated._id ? updated : o)));
      return () => { cu?.(); cu2?.(); };
    }
  }, [statusFilter]);

  const handleStatusChange = (orderId, status) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    if (selectedOrder?._id === orderId) setSelectedOrder(o => ({ ...o, status }));
  };

  const filtered = orders.filter(o =>
    !search || o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    o.orderNumber?.includes(search) || o.tableNumber?.includes(search)
  );

  const exportToExcel = () => {
    const data = filtered.map(o => ({
      'Order #': o.orderNumber, 'Date': new Date(o.createdAt).toLocaleDateString(),
      'Time': new Date(o.createdAt).toLocaleTimeString(),
      'Customer': o.customerName, 'Phone': o.customerPhone,
      'Table': o.tableNumber || 'Takeaway', 'Items': o.items.map(i => `${i.name}x${i.quantity}`).join(', '),
      'Total': o.totalAmount, 'Payment': o.paymentMethod, 'Status': o.status
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `orders-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <AdminLayout title="Orders">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input className="input pl-9" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select className="input w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s === 'all' ? 'All Status' : s}</option>)}
          </select>
          <button onClick={loadOrders} className="btn-secondary px-3"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={exportToExcel} className="btn-secondary px-3"><Download className="w-4 h-4" /></button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => (
            <div key={order._id} className="card flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => setSelectedOrder(order)}>
              <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center font-bold text-stone-700 text-sm flex-shrink-0">
                {order.tableNumber || 'TK'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-900 text-sm">{order.customerName}</span>
                  <span className="text-stone-400 text-xs">#{order.orderNumber}</span>
                </div>
                <div className="text-xs text-stone-500">
                  {order.items.length} items · {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-stone-900 text-sm">₹{order.totalAmount?.toFixed(0)}</div>
                <span className={statusClass[order.status] || 'badge-stone'}>{order.status}</span>
              </div>
              <Eye className="w-4 h-4 text-stone-400 flex-shrink-0" />
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-stone-400">
              <div className="text-4xl mb-3">📦</div>
              <div className="font-semibold">No orders found</div>
            </div>
          )}
        </div>
      )}

      {selectedOrder && (
        <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatusChange={handleStatusChange} />
      )}
    </AdminLayout>
  );
}
