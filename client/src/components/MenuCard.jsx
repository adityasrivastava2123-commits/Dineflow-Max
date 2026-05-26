import { useState } from 'react';
import { Plus, Minus, Star, Flame, Info, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const SPICE_ICONS = { 1: '🌶', 2: '🌶🌶', 3: '🌶🌶🌶' };

function VegDot({ isVeg }) {
  return (
    <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${
      isVeg ? 'border-emerald-600' : 'border-red-600'
    }`}>
      <div className={`w-2 h-2 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
    </div>
  );
}

export default function MenuCard({ item, onOpenModal, lang = 'en' }) {
  const { items: cartItems, addItem, updateQty } = useCart();

  const cartEntry = cartItems.find(
    (ci) => ci.menuItemId === item._id && !ci.portion && (!ci.addons || ci.addons.length === 0)
  );
  const qty = cartEntry?.quantity || 0;

  const displayName = lang === 'hi' && item.nameHindi ? item.nameHindi : item.name;
  const displayDesc = lang === 'hi' && item.descriptionHindi ? item.descriptionHindi : item.description;

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    // If item has portions or addons, open modal instead
    if ((item.portions?.length > 0) || (item.addons?.length > 0)) {
      onOpenModal?.(item);
      return;
    }
    addItem({
      menuItemId: item._id,
      name: displayName,
      price: item.price,
      addons: [],
      portion: null,
      specialInstructions: '',
      isVeg: item.isVeg,
    });
    toast.success(`${item.name} added!`, { duration: 1500 });
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (cartEntry) {
      updateQty(cartEntry.key, qty + 1);
    } else {
      handleQuickAdd(e);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (cartEntry) updateQty(cartEntry.key, qty - 1);
  };

  const isCustomizable = (item.portions?.length > 0) || (item.addons?.length > 0);

  return (
    <div
      className="flex gap-3 py-4 border-b border-stone-100 last:border-0 cursor-pointer hover:bg-stone-50 -mx-4 px-4 transition-colors duration-150 rounded-xl"
      onClick={() => onOpenModal?.(item)}
    >
      {/* Text Content */}
      <div className="flex-1 min-w-0">
        {/* Veg/Non-veg + Bestseller */}
        <div className="flex items-center gap-2 mb-1">
          <VegDot isVeg={item.isVeg !== false} />
          {item.isBestseller && (
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />
              Bestseller
            </span>
          )}
          {item.isNew && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              New
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-display font-semibold text-stone-900 text-sm leading-snug mb-0.5">
          {displayName}
        </h3>

        {/* Rating */}
        {item.ratings?.count > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-stone-600">
              {item.ratings.average.toFixed(1)}
            </span>
            <span className="text-xs text-stone-400">({item.ratings.count})</span>
          </div>
        )}

        {/* Description */}
        {displayDesc && (
          <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-1.5">
            {displayDesc}
          </p>
        )}

        {/* Spice + Tags */}
        <div className="flex items-center gap-2 mb-2">
          {item.spiceLevel > 0 && (
            <span className="text-xs">{SPICE_ICONS[Math.min(item.spiceLevel, 3)] || '🌶'}</span>
          )}
          {item.preparationTime > 0 && (
            <span className="text-xs text-stone-400">{item.preparationTime} min</span>
          )}
        </div>

        {/* Price + Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-display font-bold text-stone-900">
              ₹{item.price.toLocaleString('en-IN')}
            </span>
            {item.mrp && item.mrp > item.price && (
              <span className="text-xs text-stone-400 line-through ml-1.5">
                ₹{item.mrp}
              </span>
            )}
          </div>

          {/* Add / Qty control */}
          {!item.available ? (
            <span className="text-xs text-stone-400 font-medium">Unavailable</span>
          ) : qty === 0 ? (
            <button
              onClick={handleQuickAdd}
              className="w-20 h-8 bg-white border-2 border-brand-500 text-brand-600 font-bold text-sm rounded-xl flex items-center justify-center gap-1 hover:bg-brand-50 active:scale-95 transition-all duration-100 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              ADD
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-brand-500 rounded-xl h-8 px-1">
              <button
                onClick={handleDecrement}
                className="w-6 h-6 flex items-center justify-center text-white hover:bg-brand-600 rounded-lg transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-white font-bold text-sm">{qty}</span>
              <button
                onClick={handleIncrement}
                className="w-6 h-6 flex items-center justify-center text-white hover:bg-brand-600 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {isCustomizable && qty === 0 && item.available && (
          <p className="text-xs text-stone-400 mt-0.5">Customisable</p>
        )}
      </div>

      {/* Image */}
      {item.image && (
        <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-stone-100 relative">
          <img
            src={typeof item.image === 'string' ? item.image : item.image?.url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {item.discount > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-brand-500 text-white text-xs font-bold text-center py-0.5">
              {item.discount}% OFF
            </div>
          )}
        </div>
      )}
    </div>
  );
}
