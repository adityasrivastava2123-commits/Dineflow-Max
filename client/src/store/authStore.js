import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      loading: false,

      setAuth: (user, token, refreshToken) =>
        set({ user, token, refreshToken }),

      setUser: (user) => set({ user }),

      setToken: (token) => set({ token }),

      clearAuth: () =>
        set({ user: null, token: null, refreshToken: null }),

      isAuthenticated: () => !!get().token && !!get().user,

      hasRole: (...roles) => roles.includes(get().user?.role),

      isAdmin: () => ['admin', 'manager', 'superadmin'].includes(get().user?.role),

      isKitchen: () => get().user?.role === 'kitchen',

      isSuperAdmin: () => get().user?.role === 'superadmin',
    }),
    {
      name: 'dineflow_auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;
