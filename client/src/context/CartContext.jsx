import { createContext, useContext, useReducer, useCallback } from 'react';

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key = `${action.item.menuItemId}-${action.item.portion?.size || 'default'}-${JSON.stringify(action.item.addons)}`;
      const existing = state.items.find(i => i.key === key);
      if (existing) {
        return { ...state, items: state.items.map(i => i.key === key ? { ...i, quantity: i.quantity + 1 } : i) };
      }
      return { ...state, items: [...state.items, { ...action.item, key, quantity: 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.key !== action.key) };
    case 'UPDATE_QTY': {
      if (action.qty <= 0) return { ...state, items: state.items.filter(i => i.key !== action.key) };
      return { ...state, items: state.items.map(i => i.key === action.key ? { ...i, quantity: action.qty } : i) };
    }
    case 'UPDATE_INSTRUCTIONS':
      return { ...state, items: state.items.map(i => i.key === action.key ? { ...i, specialInstructions: action.text } : i) };
    case 'CLEAR':
      return { items: [], restaurantId: null };
    case 'SET_RESTAURANT':
      return state.restaurantId && state.restaurantId !== action.restaurantId
        ? { items: [], restaurantId: action.restaurantId }
        : { ...state, restaurantId: action.restaurantId };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], restaurantId: null });

  const addItem = useCallback((item) => dispatch({ type: 'ADD_ITEM', item }), []);
  const removeItem = useCallback((key) => dispatch({ type: 'REMOVE_ITEM', key }), []);
  const updateQty = useCallback((key, qty) => dispatch({ type: 'UPDATE_QTY', key, qty }), []);
  const updateInstructions = useCallback((key, text) => dispatch({ type: 'UPDATE_INSTRUCTIONS', key, text }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const setRestaurant = useCallback((id) => dispatch({ type: 'SET_RESTAURANT', restaurantId: id }), []);

  const subtotal = state.items.reduce((sum, item) => {
    const price = item.portion?.price || item.price;
    const addonsTotal = (item.addons || []).reduce((s, a) => s + a.price, 0);
    return sum + (price + addonsTotal) * item.quantity;
  }, 0);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: state.items, restaurantId: state.restaurantId,
      subtotal, itemCount,
      addItem, removeItem, updateQty, updateInstructions, clearCart, setRestaurant
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
