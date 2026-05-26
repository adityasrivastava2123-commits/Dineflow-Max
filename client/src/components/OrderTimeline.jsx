import { CheckCircle2, Clock, ChefHat, Bell, Package } from 'lucide-react';

const STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock, desc: 'Your order has been received' },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle2, desc: 'Restaurant confirmed your order' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, desc: 'Chef is cooking your food' },
  { key: 'ready', label: 'Ready', icon: Bell, desc: 'Your order is ready!' },
  { key: 'delivered', label: 'Delivered', icon: Package, desc: 'Enjoy your meal!' },
];

const STATUS_RANK = {
  pending: 0,
  accepted: 1,
  preparing: 2,
  ready: 3,
  delivered: 4,
  cancelled: -1,
};

export default function OrderTimeline({ status }) {
  const currentRank = STATUS_RANK[status] ?? 0;
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xl">❌</span>
        </div>
        <div>
          <p className="font-semibold text-red-700">Order Cancelled</p>
          <p className="text-sm text-red-500">This order has been cancelled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-stone-200" />
      {/* Progress fill */}
      <div
        className="absolute left-[19px] top-6 w-0.5 bg-brand-500 transition-all duration-700"
        style={{ height: `${(currentRank / (STEPS.length - 1)) * 100}%` }}
      />

      <div className="space-y-5">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const completed = i <= currentRank;
          const active = i === currentRank;

          return (
            <div key={step.key} className="flex items-start gap-4 relative z-10">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300 ${
                completed
                  ? 'bg-brand-500 border-brand-500 shadow-warm'
                  : 'bg-white border-stone-200'
              } ${active ? 'scale-110' : ''}`}>
                <Icon className={`w-4 h-4 ${completed ? 'text-white' : 'text-stone-300'}`} />
              </div>

              {/* Content */}
              <div className={`pt-1.5 transition-opacity duration-300 ${completed ? 'opacity-100' : 'opacity-40'}`}>
                <p className={`text-sm font-semibold ${active ? 'text-brand-600' : completed ? 'text-stone-800' : 'text-stone-400'}`}>
                  {step.label}
                  {active && (
                    <span className="ml-2 inline-flex items-center text-xs font-normal text-brand-500">
                      <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse mr-1" />
                      Current
                    </span>
                  )}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
