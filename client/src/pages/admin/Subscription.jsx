import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { restaurantAPI, paymentsAPI } from '../../services/api';
import { Check, CreditCard, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const PLANS = [
  { key: 'trial', name: 'Trial', price: 0, period: '30 days', features: ['5 tables', 'Basic menu', 'QR ordering', 'Order management'], color: 'stone' },
  { key: 'basic', name: 'Basic', price: 999, period: '/month', features: ['20 tables', 'Analytics', 'WhatsApp alerts', 'Coupon codes', 'Customer loyalty'], color: 'blue' },
  { key: 'standard', name: 'Standard', price: 1999, period: '/month', features: ['Unlimited tables', 'Kitchen Display', 'Inventory', 'PDF invoices', 'Multi-menu', 'Priority support'], color: 'orange', popular: true },
  { key: 'premium', name: 'Premium', price: 3999, period: '/month', features: ['Everything in Standard', 'Multi-branch', 'GST reports', 'White label', 'API access', 'Dedicated support'], color: 'purple' },
];

const colorClasses = {
  stone: { bg: 'bg-stone-50', border: 'border-stone-200', btn: 'bg-stone-800 hover:bg-stone-700 text-white' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', btn: 'bg-blue-600 hover:bg-blue-700 text-white' },
  orange: { bg: 'bg-orange-50', border: 'border-brand-400', btn: 'bg-brand-500 hover:bg-brand-600 text-white shadow-warm' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', btn: 'bg-purple-600 hover:bg-purple-700 text-white' },
};

export default function AdminSubscription() {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    restaurantAPI.getAdminDetails().then(r => setRestaurant(r.data)).finally(() => setLoading(false));
    // Load Razorpay
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const handleUpgrade = async (plan) => {
    setProcessing(plan.key);
    try {
      const res = await paymentsAPI.createSubscription(plan.key);
      if (plan.price === 0) {
        setRestaurant(res.data.restaurant);
        toast.success('Trial activated!');
        setProcessing(null);
        return;
      }

      const { orderId, amount } = res.data;
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount, currency: 'INR',
        name: 'DineFlow', description: `${plan.name} Plan Subscription`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verify = await paymentsAPI.verifySubscription({ ...response, plan: plan.key });
            setRestaurant(verify.data.restaurant);
            toast.success(`${plan.name} plan activated! 🎉`);
          } catch { toast.error('Verification failed. Contact support.'); }
        },
        modal: { ondismiss: () => setProcessing(null) },
        theme: { color: '#f97316' }
      };
      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
      setProcessing(null);
    }
  };

  const sub = restaurant?.subscription;
  const daysLeft = sub?.expiresAt ? Math.ceil((new Date(sub.expiresAt) - new Date()) / 86400000) : 0;

  if (loading) return <AdminLayout title="Subscription"><div className="skeleton h-96 rounded-2xl" /></AdminLayout>;

  return (
    <AdminLayout title="Subscription & Billing">
      {/* Current plan */}
      <div className={`card mb-6 ${daysLeft <= 7 && daysLeft > 0 ? 'border-amber-300 bg-amber-50' : ''}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-stone-500 font-semibold uppercase tracking-wider mb-1">Current Plan</div>
            <div className="font-display text-2xl font-black text-stone-900 capitalize">{sub?.plan || 'Trial'}</div>
            <div className={`text-sm font-semibold mt-1 ${sub?.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>
              {sub?.status === 'active' ? '✓ Active' : '✗ Expired'}
            </div>
          </div>
          <div className="text-right">
            <div className={`font-display text-3xl font-black ${daysLeft <= 7 ? 'text-amber-600' : 'text-stone-900'}`}>{daysLeft}</div>
            <div className="text-xs text-stone-500">days remaining</div>
            {sub?.expiresAt && <div className="text-xs text-stone-400 mt-1">Expires {new Date(sub.expiresAt).toLocaleDateString('en-IN')}</div>}
          </div>
        </div>
        {daysLeft <= 7 && daysLeft > 0 && (
          <div className="mt-3 p-3 bg-amber-100 rounded-xl text-sm text-amber-800 font-semibold">
            ⚠️ Your subscription expires in {daysLeft} days. Renew now to avoid service interruption.
          </div>
        )}
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {PLANS.map(plan => {
          const cls = colorClasses[plan.color];
          const isCurrent = sub?.plan === plan.key;
          return (
            <div key={plan.key} className={`relative rounded-2xl border-2 p-5 flex flex-col ${cls.border} ${plan.popular ? 'shadow-warm' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Current
                </div>
              )}
              <div className="font-display font-bold text-lg text-stone-900">{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display font-black text-2xl text-stone-950">
                  {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && <span className="text-stone-500 text-xs">{plan.period}</span>}
              </div>
              <ul className="space-y-1.5 flex-1 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-stone-600">
                    <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => !isCurrent && handleUpgrade(plan)}
                disabled={isCurrent || processing === plan.key}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${isCurrent ? 'bg-emerald-100 text-emerald-700' : cls.btn}`}>
                {processing === plan.key ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />Processing...</span> :
                  isCurrent ? '✓ Current Plan' :
                  sub?.plan === 'trial' ? 'Upgrade' : 'Switch Plan'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="card bg-stone-50">
        <div className="flex items-center gap-3 text-stone-600 text-sm">
          <CreditCard className="w-5 h-5 text-stone-400" />
          <div>Payments are processed securely via Razorpay. Subscriptions are monthly and can be changed anytime. For billing support, contact <a href="mailto:billing@dineflow.app" className="text-brand-600 hover:underline">billing@dineflow.app</a></div>
        </div>
      </div>
    </AdminLayout>
  );
}
