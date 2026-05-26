import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Clock, CheckCircle2, ChevronRight, Wifi, WifiOff, Volume2, VolumeX, LogOut } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const STATUS_FLOW = { pending: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'delivered' };
const STATUS_LABELS = { pending: 'Accept', accepted: 'Start Cooking', preparing: 'Mark Ready', ready: 'Delivered' };
const STATUS_COLORS = {
  pending: 'border-amber-500 bg-amber-500/10',
  accepted: 'border-blue-500 bg-blue-500/10',
  preparing: 'border-orange-500 bg-orange-500/10',
  ready: 'border-emerald-500 bg-emerald-500/10',
};

function OrderTimer({ createdAt, estimatedReadyAt }) {
  const [elapsed, setElapsed] = useState(0);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const start = new Date(createdAt).getTime();
      const el = Math.floor((now - start) / 1000);
      setElapsed(el);
      if (estimatedReadyAt) {
        setIsOverdue(now > new Date(estimatedReadyAt).getTime());
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt, estimatedReadyAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${isOverdue ? 'text-red-400 animate-pulse' : 'text-stone-400'}`}>
      <Clock className="w-3.5 h-3.5" />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      {isOverdue && <span className="text-red-400 text-xs font-sans font-bold ml-1 animate-pulse">OVERDUE!</span>}
    </div>
  );
}

function OrderCard({ order, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);
  const nextStatus = STATUS_FLOW[order.status];

  const handleUpdate = async () => {
    if (!nextStatus || updating) return;
    setUpdating(true);
    try {
      await ordersAPI.updateStatus(order._id, nextStatus);
      onStatusUpdate(order._id, nextStatus);
    } catch {
      toast.error('Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`kitchen-card border-l-4 ${STATUS_COLORS[order.status] || 'border-stone-500'} animate-fade-up`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-white font-black text-xl">
              {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}
            </span>
            {order.status === 'pending' && (
              <span className="px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded-full animate-pulse">NEW</span>
            )}
          </div>
          <div className="text-stone-400 text-sm">#{order.orderNumber} · {order.customerName}</div>
        </div>
        <OrderTimer createdAt={order.createdAt} estimatedReadyAt={order.estimatedReadyAt} />
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="w-7 h-7 bg-stone-700 rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              {item.quantity}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm leading-tight">
                {item.name}
                {item.portion?.size && <span className="text-stone-400 font-normal"> ({item.portion.size})</span>}
              </div>
              {item.addons?.length > 0 && (
                <div className="text-stone-400 text-xs">+ {item.addons.map(a => a.name).join(', ')}</div>
              )}
              {item.specialInstructions && (
                <div className="text-amber-400 text-xs mt-0.5">📝 {item.specialInstructions}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
          📋 {order.notes}
        </div>
      )}

      {/* Action */}
      {nextStatus && (
        <button onClick={handleUpdate} disabled={updating}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            order.status === 'ready' ? 'bg-emerald-500 hover:bg-emerald-400 text-white' :
            order.status === 'preparing' ? 'bg-orange-500 hover:bg-orange-400 text-white' :
            order.status === 'accepted' ? 'bg-blue-500 hover:bg-blue-400 text-white' :
            'bg-amber-500 hover:bg-amber-400 text-black'
          }`}>
          {updating ? <div className="w-4 h-4 border-2 border-current/50 border-t-current rounded-full animate-spin" /> : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              {STATUS_LABELS[order.status]}
            </>
          )}
        </button>
      )}
      {order.status === 'delivered' && (
        <div className="w-full py-3 rounded-xl bg-stone-700 text-stone-400 text-sm font-semibold text-center">
          ✓ Completed
        </div>
      )}
    </div>
  );
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { connected, joinKitchen, on } = useSocket();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const audioRef = useRef(null);

  const playAlert = () => {
    if (!soundEnabled) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
    // Double beep
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      osc2.connect(gain); gain.connect(ctx.destination);
      osc2.frequency.setValueAtTime(1100, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.start(); osc2.stop(ctx.currentTime + 0.5);
    }, 200);
  };

  useEffect(() => {
    ordersAPI.getLiveOrders().then(res => {
      setOrders(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));

    const restaurantId = user?.restaurantId?._id || user?.restaurantId;
    if (restaurantId) {
      joinKitchen(restaurantId);
      const cleanup = on('new-order', (order) => {
        setOrders(prev => [order, ...prev]);
        playAlert();
        toast.success(`New order! Table ${order.tableNumber || 'Takeaway'}`, {
          duration: 5000, style: { background: '#1c1917', color: '#fff', border: '1px solid #44403c' }
        });
      });

      const cleanupUpdate = on('order-updated', (updated) => {
        setOrders(prev => {
          if (['delivered', 'cancelled'].includes(updated.status)) {
            return prev.filter(o => o._id !== updated._id);
          }
          return prev.map(o => o._id === updated._id ? updated : o);
        });
      });

      return () => { cleanup?.(); cleanupUpdate?.(); };
    }
  }, [user]);

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders(prev => {
      if (['delivered', 'cancelled'].includes(newStatus)) {
        return prev.filter(o => o._id !== orderId);
      }
      return prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o);
    });
  };

  const grouped = {
    pending: orders.filter(o => o.status === 'pending'),
    accepted: orders.filter(o => o.status === 'accepted'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready'),
  };

  const columns = [
    { key: 'pending', label: 'New Orders', color: 'text-amber-400', dot: 'bg-amber-400' },
    { key: 'accepted', label: 'Accepted', color: 'text-blue-400', dot: 'bg-blue-400' },
    { key: 'preparing', label: 'Cooking', color: 'text-orange-400', dot: 'bg-orange-400' },
    { key: 'ready', label: 'Ready', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-stone-950 font-body">
      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-white text-lg">Kitchen Display</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${connected ? 'bg-emerald-900 text-emerald-400' : 'bg-red-900 text-red-400'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Live' : 'Reconnecting...'}
          </div>

          <button onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'text-emerald-400 bg-emerald-900/50' : 'text-stone-500 bg-stone-800'}`}>
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <Link to="/admin" className="text-xs text-stone-400 hover:text-white px-3 py-1.5 bg-stone-800 rounded-lg transition-colors flex items-center gap-1">
            Admin <ChevronRight className="w-3 h-3" />
          </Link>

          <button onClick={() => { logout(); navigate('/login'); }}
            className="p-2 text-stone-400 hover:text-red-400 bg-stone-800 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Total order count */}
      <div className="px-4 py-2 bg-stone-900/50 border-b border-stone-800 flex items-center gap-4 text-sm">
        {columns.map(col => (
          <div key={col.key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${col.dot}`} />
            <span className="text-stone-400">{col.label}:</span>
            <span className={`font-bold ${col.color}`}>{grouped[col.key]?.length || 0}</span>
          </div>
        ))}
        <div className="ml-auto text-stone-500">Total active: <span className="text-white font-bold">{orders.length}</span></div>
      </div>

      {/* Kanban columns */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-0 h-[calc(100vh-120px)] overflow-hidden">
          {columns.map(col => (
            <div key={col.key} className="flex flex-col border-r border-stone-800 last:border-0 overflow-hidden">
              {/* Column header */}
              <div className="px-3 py-3 border-b border-stone-800 flex items-center gap-2 bg-stone-900/30 flex-shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <span className={`font-display font-bold text-sm ${col.color}`}>{col.label}</span>
                <div className={`ml-auto w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${col.dot.replace('bg-', 'bg-').replace('400', '400/20')} ${col.color}`}>
                  {grouped[col.key]?.length || 0}
                </div>
              </div>

              {/* Orders */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
                {grouped[col.key]?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-stone-700 text-sm">
                    <ChefHat className="w-6 h-6 mb-2" />
                    Empty
                  </div>
                ) : (
                  grouped[col.key].map(order => (
                    <OrderCard key={order._id} order={order} onStatusUpdate={handleStatusUpdate} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
