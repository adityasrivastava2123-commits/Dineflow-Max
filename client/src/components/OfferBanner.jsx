import { useState } from 'react';
import { Tag, X, Zap, ChevronRight } from 'lucide-react';

const BANNER_VARIANTS = [
  { bg: 'from-brand-500 to-orange-600', text: 'text-white' },
  { bg: 'from-emerald-500 to-teal-600', text: 'text-white' },
  { bg: 'from-purple-500 to-indigo-600', text: 'text-white' },
  { bg: 'from-amber-400 to-yellow-500', text: 'text-stone-900' },
];

export function OfferBanner({ offers = [], onApply }) {
  const [dismissed, setDismissed] = useState([]);
  const [applying, setApplying] = useState(null);

  const visible = offers.filter((o) => !dismissed.includes(o._id || o.code));

  if (!visible.length) return null;

  const handleApply = async (offer) => {
    setApplying(offer.code);
    await onApply?.(offer.code);
    setTimeout(() => setApplying(null), 1000);
  };

  return (
    <div className="space-y-2 mb-4">
      {visible.map((offer, i) => {
        const variant = BANNER_VARIANTS[i % BANNER_VARIANTS.length];
        const isApplying = applying === offer.code;

        return (
          <div
            key={offer._id || offer.code}
            className={`relative bg-gradient-to-r ${variant.bg} rounded-2xl p-4 overflow-hidden`}
          >
            {/* Decorative circles */}
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full" />
            <div className="absolute -right-2 -bottom-6 w-20 h-20 bg-white/10 rounded-full" />

            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Tag className={`w-5 h-5 ${variant.text}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Zap className={`w-3 h-3 ${variant.text}`} />
                  <p className={`text-xs font-bold uppercase tracking-wider ${variant.text} opacity-80`}>
                    Limited Offer
                  </p>
                </div>
                <p className={`font-display font-bold text-sm ${variant.text} leading-tight`}>
                  {offer.description || `${offer.value}${offer.type === 'percent' ? '%' : '₹'} off`}
                  {offer.minOrderAmount > 0 && (
                    <span className="font-normal opacity-80"> · Min ₹{offer.minOrderAmount}</span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 bg-white/25 rounded-lg ${variant.text}`}>
                    {offer.code}
                  </span>
                  <button
                    onClick={() => handleApply(offer)}
                    disabled={isApplying}
                    className={`text-xs font-bold flex items-center gap-0.5 ${variant.text} opacity-90 hover:opacity-100`}
                  >
                    {isApplying ? 'Applying...' : 'Apply'}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setDismissed((d) => [...d, offer._id || offer.code])}
                className={`${variant.text} opacity-50 hover:opacity-100 flex-shrink-0`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HappyHoursBanner({ discount, endTime }) {
  return (
    <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-3 mb-4 flex items-center gap-3">
      <div className="text-2xl">⚡</div>
      <div>
        <p className="font-display font-bold text-stone-900 text-sm">Happy Hours!</p>
        <p className="text-xs text-stone-800 opacity-80">
          {discount}% off all items · Ends at {endTime}
        </p>
      </div>
    </div>
  );
}

export default OfferBanner;
