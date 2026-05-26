import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Clock, ChefHat, Package, Star, MessageSquare } from 'lucide-react';
import { ordersAPI, reviewsAPI, supportAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Received', icon: Package, desc: 'Your order has been placed' },
  { key: 'accepted', label: 'Confirmed', icon: CheckCircle2, desc: 'Restaurant confirmed your order' },
  { key: 'preparing', label: 'Being Prepared', icon: ChefHat, desc: 'Our chefs are cooking your food' },
  { key: 'ready', label: 'Ready!', icon: Package, desc: 'Your order is ready for pickup/delivery' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, desc: 'Enjoy your meal!' },
];

const STATUS_INDEX = { pending: 0, accepted: 1, preparing: 2, ready: 3, delivered: 4, cancelled: -1 };

export default function OrderTracking() {
  const { orderId } = useParams();
  const location = useLocation();
  const { joinOrder, on } = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');

  useEffect(() => {
    ordersAPI.getOrder(orderId).then(res => {
      setOrder(res.data);
      setLoading(false);
      // Show review prompt if delivered
      if (res.data.status === 'delivered' && !reviewSubmitted) {
        setTimeout(() => setShowReview(true), 2000);
      }
    }).catch(() => setLoading(false));

    joinOrder(orderId);
    const cleanup = on('status-update', ({ status, orderId: id }) => {
      if (id === orderId) {
        setOrder(prev => prev ? { ...prev, status } : prev);
        const step = STATUS_STEPS.find(s => s.key === status);
        if (step) {
          toast.success(step.label, { icon: '✅', duration: 4000 });
        }
        if (status === 'ready') {
          toast.success('🎉 Your order is READY!', { duration: 6000 });
        }
        if (status === 'delivered') {
          setTimeout(() => setShowReview(true), 2000);
        }
      }
    });
    return cleanup;
  }, [orderId]);

  const submitReview = async () => {
    if (!rating) return;
    try {
      await reviewsAPI.createReview({
        orderId, restaurantId: order.restaurantId._id,
        customerName: order.customerName, customerPhone: order.customerPhone,
        rating, comment
      });
      setReviewSubmitted(true);
      setShowReview(false);
      toast.success('Thank you for your review!');
    } catch { toast.error('Failed to submit review'); }
  };

  const submitSupport = async () => {
    if (!supportMsg.trim()) return;
    try {
      await supportAPI.createTicket({
        restaurantId: order.restaurantId._id, orderId,
        customerName: order.customerName, customerPhone: order.customerPhone,
        subject: `Issue with order #${order.orderNumber}`,
        description: supportMsg,
        messages: [{ sender: order.customerName, senderRole: 'customer', text: supportMsg }]
      });
      setShowSupport(false);
      toast.success('Support ticket created. We\'ll get back to you!');
    } catch { toast.error('Failed to create ticket'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-center px-4">
        <div>
          <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <div className="font-bold text-stone-700">Order not found</div>
        </div>
      </div>
    );
  }

  const currentStep = STATUS_INDEX[order.status] ?? 0;
  const restaurant = order.restaurantId;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-stone-950 text-white px-4 py-6 text-center">
        <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ChefHat className="w-7 h-7" />
        </div>
        <div className="font-display font-black text-xl mb-1">{restaurant?.name}</div>
        <div className="text-stone-400 text-sm">Order #{order.orderNumber}</div>
        {order.tableNumber && <div className="text-stone-400 text-sm">Table {order.tableNumber}</div>}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Status */}
        {order.status === 'cancelled' ? (
          <div className="card border-red-200 bg-red-50">
            <div className="text-center">
              <div className="text-red-500 font-bold text-lg mb-1">Order Cancelled</div>
              <div className="text-red-400 text-sm">Please contact the restaurant for details</div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="font-display font-bold text-stone-900 mb-4">Order Status</div>
            <div className="space-y-4">
              {STATUS_STEPS.slice(0, -1).map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.key} className="flex items-start gap-4">
                    <div className="relative flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${done ? 'bg-emerald-500' : active ? 'bg-brand-500 animate-pulse-soft' : 'bg-stone-200'}`}>
                        <step.icon className={`w-4 h-4 ${done || active ? 'text-white' : 'text-stone-400'}`} />
                      </div>
                      {i < STATUS_STEPS.length - 2 && (
                        <div className={`w-0.5 h-8 mt-1 ${done ? 'bg-emerald-400' : 'bg-stone-200'}`} />
                      )}
                    </div>
                    <div className="pt-1 pb-4">
                      <div className={`font-semibold text-sm ${active ? 'text-brand-600' : done ? 'text-stone-700' : 'text-stone-400'}`}>
                        {step.label}
                        {active && <span className="ml-2 text-xs font-normal text-brand-400 animate-pulse">● Current</span>}
                      </div>
                      {(active || done) && <div className="text-xs text-stone-400 mt-0.5">{step.desc}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {order.estimatedReadyAt && order.status !== 'delivered' && (
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2 text-sm text-stone-600">
                <Clock className="w-4 h-4 text-brand-500" />
                Est. ready by {new Date(order.estimatedReadyAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="card">
          <div className="font-display font-bold text-stone-900 mb-3">Your Order</div>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 bg-stone-100 rounded text-xs font-bold flex items-center justify-center text-stone-600">{item.quantity}x</span>
                <span className="flex-1 text-stone-700">{item.name}{item.portion?.size ? ` (${item.portion.size})` : ''}</span>
                <span className="font-semibold text-stone-900">₹{((item.price + (item.addons || []).reduce((s, a) => s + a.price, 0)) * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 space-y-1 text-sm">
            <div className="flex justify-between text-stone-500"><span>Subtotal</span><span>₹{order.subtotal?.toFixed(0)}</span></div>
            {order.discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{order.discountAmount?.toFixed(0)}</span></div>}
            <div className="flex justify-between text-stone-500"><span>Tax</span><span>₹{order.taxAmount?.toFixed(0)}</span></div>
            {order.tipAmount > 0 && <div className="flex justify-between text-stone-500"><span>Tip</span><span>₹{order.tipAmount?.toFixed(0)}</span></div>}
            <div className="flex justify-between font-display font-black text-stone-900 pt-1.5 border-t border-stone-100 text-base">
              <span>Total</span><span>₹{order.totalAmount?.toFixed(0)}</span>
            </div>
            <div className={`text-xs font-semibold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
              Payment: {order.paymentStatus?.toUpperCase()} via {order.paymentMethod?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Invoice + Support */}
        <div className="grid grid-cols-2 gap-3">
          <a href={`/api/invoices/order/${orderId}`} target="_blank" rel="noopener noreferrer"
            className="btn-secondary justify-center py-3 text-sm">
            📄 Download Invoice
          </a>
          <button onClick={() => setShowSupport(true)} className="btn-secondary justify-center py-3 text-sm">
            <MessageSquare className="w-4 h-4" />
            Support
          </button>
        </div>

        {/* Loyalty points earned */}
        {order.status === 'delivered' && order.loyaltyPointsEarned > 0 && (
          <div className="card bg-purple-50 border-purple-200">
            <div className="text-center">
              <div className="text-2xl mb-1">🎁</div>
              <div className="font-bold text-purple-800">You earned {order.loyaltyPointsEarned} points!</div>
              <div className="text-xs text-purple-600 mt-1">Use them on your next order</div>
            </div>
          </div>
        )}

        <Link to={`/restaurant/${restaurant?.slug || ''}`} className="btn-secondary w-full justify-center py-3">
          Order again →
        </Link>
      </div>

      {/* Review modal */}
      {showReview && !reviewSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowReview(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-up">
            <h3 className="font-display font-bold text-xl text-stone-900 text-center mb-1">How was your meal?</h3>
            <p className="text-stone-500 text-sm text-center mb-4">Rate your experience at {restaurant?.name}</p>
            <div className="flex justify-center gap-2 mb-4">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`w-9 h-9 transition-all ${s <= rating ? 'text-amber-400 fill-amber-400 scale-110' : 'text-stone-300'}`} />
                </button>
              ))}
            </div>
            <textarea className="input resize-none text-sm mb-4" rows={2} placeholder="Tell us more (optional)..."
              value={comment} onChange={e => setComment(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setShowReview(false)} className="btn-secondary flex-1">Skip</button>
              <button onClick={submitReview} disabled={!rating} className="btn-primary flex-1">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Support modal */}
      {showSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSupport(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-up">
            <h3 className="font-display font-bold text-xl text-stone-900 mb-1">Need Help?</h3>
            <p className="text-stone-500 text-sm mb-4">Describe your issue and we'll respond shortly</p>
            <textarea className="input resize-none text-sm mb-4" rows={4} placeholder="What's the issue?"
              value={supportMsg} onChange={e => setSupportMsg(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setShowSupport(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submitSupport} className="btn-primary flex-1">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
