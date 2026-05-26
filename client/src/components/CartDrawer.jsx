import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

function CartItem({ item, updateQty, removeItem }) {
  const price = item.portion?.price || item.price;
  const addonsTotal = (item.addons || []).reduce((s, a) => s + a.price, 0);
  const lineTotal = (price + addonsTotal) * item.quantity;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0">
      {/* Veg dot */}
      <div className={`mt-1 w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center ${
        item.isVeg !== false ? 'border-emerald-600' : 'border-red-600'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${
          item.isVeg !== false ? 'bg-emerald-500' : 'bg-red-500'
        }`} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800 leading-snug truncate">{item.name}</p>
        {item.portion && (
          <p className="text-xs text-stone-400">{item.portion.size}</p>
        )}
        {item.addons?.length > 0 && (
          <p className="text-xs text-stone-400">+ {item.addons.map((a) => a.name).join(', ')}</p>
        )}
        {item.specialInstructions && (
          <p className="text-xs text-amber-600 italic truncate">"{item.specialInstructions}"</p>
        )}

        {/* Qty controls */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 bg-brand-50 border border-brand-200 rounded-lg">
            <button
              onClick={() => updateQty(item.key, item.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-brand-600 hover:bg-brand-100 rounded-l-lg transition-colors"
            >
              {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            </button>
            <span className="w-6 text-center text-sm font-bold text-stone-800">{item.quantity}</span>
            <button
              onClick={() => updateQty(item.key, item.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center text-brand-600 hover:bg-brand-100 rounded-r-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-stone-800">₹{lineTotal.toLocaleString('en-IN')}</p>
        {item.quantity > 1 && (
          <p className="text-xs text-stone-400">₹{(price + addonsTotal).toLocaleString('en-IN')} each</p>
        )}
      </div>
    </div>
  );
}

export default function CartDrawer({ isOpen, onClose, restaurant, tableNumber }) {
  const { items, subtotal, itemCount, updateQty, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const taxRate = restaurant?.taxRate || restaurant?.settings?.taxPercent || 5;
  const taxAmount = subtotal * taxRate / 100;
  const total = subtotal + taxAmount;

  const handleCheckout = () => {
    onClose();
    navigate('/checkout', {
      state: { restaurant, tableNumber, items, subtotal },
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer - bottom sheet on mobile, right panel on desktop */}
      <div
        ref={drawerRef}
        className="fixed bottom-0 left-0 right-0 sm:left-auto sm:top-0 sm:right-0 sm:bottom-0 z-50
                   bg-white sm:w-96 rounded-t-3xl sm:rounded-none
                   flex flex-col max-h-[90vh] sm:max-h-screen
                   shadow-2xl animate-fade-up sm:animate-slide-in"
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-500" />
            <h2 className="font-display font-bold text-stone-900 text-lg">
              Your Cart
            </h2>
            <span className="w-6 h-6 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Restaurant + Table info */}
        {restaurant && (
          <div className="px-5 py-2 bg-stone-50 border-b border-stone-100">
            <p className="text-xs text-stone-500">
              {restaurant.name} · Table {tableNumber}
            </p>
          </div>
        )}

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-stone-400">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm mt-1">Add items from the menu</p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <CartItem
                  key={item.key}
                  item={item}
                  updateQty={updateQty}
                  removeItem={removeItem}
                />
              ))}
              <button
                onClick={clearCart}
                className="mt-3 text-xs text-red-400 hover:text-red-500 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear cart
              </button>
            </>
          )}
        </div>

        {/* Summary + CTA */}
        {items.length > 0 && (
          <div className="border-t border-stone-100 px-5 py-4 space-y-3 bg-white">
            {/* Bill summary */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>GST ({taxRate}%)</span>
                <span>₹{taxAmount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-100">
                <span>Total</span>
                <span>₹{total.toFixed(0)}</span>
              </div>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              className="btn-primary w-full py-3.5 text-base"
            >
              Proceed to Checkout
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
