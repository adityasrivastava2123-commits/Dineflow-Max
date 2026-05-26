import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      tableNumber: null,

      setRestaurant: (restaurantId, tableNumber) => {
        const { restaurantId: current } = get();
        if (current && current !== restaurantId) {
          // Different restaurant — clear cart
          set({ items: [], restaurantId, tableNumber });
        } else {
          set({ restaurantId, tableNumber });
        }
      },

      addItem: (item) => {
        const key = `${item.menuItemId}-${item.portion?.size || 'default'}-${JSON.stringify(item.addons || [])}`;
        const items = get().items;
        const existing = items.find((i) => i.key === key);
        if (existing) {
          set({ items: items.map((i) => i.key === key ? { ...i, quantity: i.quantity + 1 } : i) });
        } else {
          set({ items: [...items, { ...item, key, quantity: 1 }] });
        }
      },

      removeItem: (key) => set({ items: get().items.filter((i) => i.key !== key) }),

      updateQty: (key, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.key !== key) });
        } else {
          set({ items: get().items.map((i) => i.key === key ? { ...i, quantity: qty } : i) });
        }
      },

      updateInstructions: (key, text) =>
        set({ items: get().items.map((i) => i.key === key ? { ...i, specialInstructions: text } : i) }),

      clearCart: () => set({ items: [], restaurantId: null, tableNumber: null }),

      // Computed
      get subtotal() {
        return get().items.reduce((sum, item) => {
          const price = item.portion?.price || item.price;
          const addons = (item.addons || []).reduce((s, a) => s + a.price, 0);
          return sum + (price + addons) * item.quantity;
        }, 0);
      },

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    {
      name: 'dineflow_cart',
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
        tableNumber: state.tableNumber,
      }),
    }
  )
);

export default useCartStore;
