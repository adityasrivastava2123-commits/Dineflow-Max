import { useState } from 'react';
import { Clock, ChefHat, CheckCircle2, Package, X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const STATUS_FLOW = {
  pending: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
};

const NEXT_LABEL = {
  pending: 'Accept',
  accepted: 'Start Cooking',
  preparing: 'Mark Ready',
  ready: 'Mark Delivered',
};

export default function OrderCard({ order, onStatusChange, showCustomer = true, compact = false }) {
  const [updating, setUpdating] = useState(false);

  const nextStatus = STATUS_FLOW[order.status];
  const nextLabel = NEXT_LABEL[order.status];

  const elapsed = formatDistanceToNow(new Date(order.createdAt), { addSuffix: false });

  const handleStatusUpdate = async () => {
    if (!nextStatus || updating) return;
    setUpdating(true);
    try {
      await ordersAPI.updateStatus(order._id, nextStatus);
      onStatusChange?.(order._id, nextStatus);
      toast.success(`Order ${nextStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (order.status !== 'pending' || updating) return;
    setUpdating(true);
    try {
      await ordersAPI.cancelOrder(order._id);
      onStatusChange?.(order._id, 'cancelled');
      toast.success('Order cancelled');
    } catch {
      toast.error('Failed to cancel');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-stone-100 shadow-card overflow-hidden ${
      order.status === 'pending' ? 'border-l-4 border-l-amber-400' :
      order.status === 'preparing' ? 'border-l-4 border-l-orange-400' :
      order.status === 'ready' ? 'border-l-4 border-l-emerald-400' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-50">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-stone-900 text-sm">#{order.orderNumber}</span>
          <span className="text-xs font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
            Table {order.tableNumber}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-stone-400">
            <Clock className="w-3 h-3" />
            {elapsed}
          </div>
          <StatusBadge status={order.status} size="xs" />
        </div>
      </div>

      {/* Customer */}
      {showCustomer && order.customer && (
        <div className="px-4 py-2 bg-stone-50 text-xs text-stone-500">
          {order.customer.name} · {order.customer.phone}
        </div>
      )}

      {/* Items */}
      <div className="px-4 py-3">
        {!compact ? (
          <div className="space-y-1.5">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start text-sm">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-stone-800">{item.name}</span>
                  {item.specialInstructions && (
                    <p className="text-xs text-amber-600 italic mt-0.5">"{item.specialInstructions}"</p>
                  )}
                  {item.addons?.length > 0 && (
                    <p className="text-xs text-stone-400">+ {item.addons.map((a) => a.name).join(', ')}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                  <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded font-semibold">
                    ×{item.quantity}
                  </span>
                  <span className="text-xs font-semibold text-stone-700">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-500 line-clamp-1">
            {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
          </p>
        )}
      </div>

      {/* Footer: total + actions */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-stone-400">Total</p>
          <p className="font-display font-bold text-stone-900">
            ₹{order.totalAmount?.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {order.status === 'pending' && (
            <button
              onClick={handleCancel}
              disabled={updating}
              className="text-xs text-red-400 hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          )}
          {nextLabel && (
            <button
              onClick={handleStatusUpdate}
              disabled={updating}
              className="btn-primary py-1.5 px-3 text-xs"
            >
              {updating ? (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {order.status === 'pending' && <CheckCircle2 className="w-3 h-3" />}
                  {order.status === 'accepted' && <ChefHat className="w-3 h-3" />}
                  {order.status === 'preparing' && <Package className="w-3 h-3" />}
                  {nextLabel}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
