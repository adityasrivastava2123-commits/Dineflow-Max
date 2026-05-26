import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatCart({ onClick }) {
  const { itemCount, subtotal } = useCart();

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.button
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={onClick}
          className="fixed bottom-6 left-4 right-4 z-30 mx-auto max-w-sm
                     bg-brand-500 text-white rounded-2xl shadow-warm
                     flex items-center justify-between px-5 py-3.5
                     hover:bg-brand-600 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold">{itemCount}</span>
            </div>
            <span className="font-semibold text-sm">View Cart</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
            <ShoppingBag className="w-4 h-4 opacity-80 ml-1" />
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
