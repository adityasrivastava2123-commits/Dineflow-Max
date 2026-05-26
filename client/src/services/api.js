import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dineflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dineflow_token');
      localStorage.removeItem('dineflow_user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  customerIdentify: (data) => api.post('/auth/customer-identify', data),
  getMe: () => api.get('/auth/me'),
  createStaff: (data) => api.post('/auth/staff', data),
  getStaff: () => api.get('/auth/staff'),
  deleteStaff: (id) => api.delete(`/auth/staff/${id}`),
  refreshToken: (token) => api.post('/auth/refresh-token', { refreshToken: token }),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Menu
export const menuAPI = {
  getMenu: (slug) => api.get(`/menu/${slug}`),
  getAdminMenu: () => api.get('/menu/admin/all'),
  createItem: (data) => api.post('/menu', data),
  updateItem: (id, data) => api.put(`/menu/${id}`, data),
  deleteItem: (id) => api.delete(`/menu/${id}`),
  toggleAvailability: (id) => api.patch(`/menu/${id}/toggle`),
};

// Orders
export const ordersAPI = {
  placeOrder: (data) => api.post('/orders', data),
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
  getLiveOrders: () => api.get('/orders/kitchen/live'),
  getCustomerHistory: (phone, restaurantId) => api.get('/orders/customer/history', { params: { phone, restaurantId } }),
};

// Restaurants
export const restaurantAPI = {
  getPublic: (slug) => api.get(`/restaurants/${slug}`),
  getAdminDetails: () => api.get('/restaurants/admin/details'),
  update: (data) => api.put('/restaurants', data),
  addTable: (data) => api.post('/restaurants/tables', data),
  getQRCodes: () => api.get('/restaurants/tables/qrcodes'),
  updateTableStatus: (number, isOccupied) => api.patch(`/restaurants/tables/${number}/status`, { isOccupied }),
};

// Payments
export const paymentsAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  createSubscription: (plan) => api.post('/payments/subscription', { plan }),
  verifySubscription: (data) => api.post('/payments/subscription/verify', data),
  refund: (data) => api.post('/payments/refund', data),
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getTopItems: (days) => api.get('/analytics/top-items', { params: { days } }),
  getRevenueTrend: (days) => api.get('/analytics/revenue-trend', { params: { days } }),
  getPeakHours: () => api.get('/analytics/peak-hours'),
};

// Support
export const supportAPI = {
  createTicket: (data) => api.post('/support/tickets', data),
  getTickets: () => api.get('/support/tickets'),
  replyToTicket: (id, text) => api.post(`/support/tickets/${id}/reply`, { text }),
  updateTicket: (id, data) => api.patch(`/support/tickets/${id}`, data),
};

// Loyalty
export const loyaltyAPI = {
  getAccount: (phone, restaurantId) => api.get(`/loyalty/${phone}`, { params: { restaurantId } }),
  getMembers: () => api.get('/loyalty/admin/members'),
};

// Reviews
export const reviewsAPI = {
  createReview: (data) => api.post('/reviews', data),
  getAdminReviews: () => api.get('/reviews/admin'),
  getRestaurantReviews: (id) => api.get(`/reviews/restaurant/${id}`),
};

// Inventory
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  logWastage: (id, data) => api.post(`/inventory/${id}/wastage`, data),
  getLowStock: () => api.get('/inventory/low-stock'),
};

// Coupons
export const couponsAPI = {
  getAll: () => api.get('/coupons'),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
  validate: (data) => api.post('/coupons/validate', data),
};

// Upload
export const uploadAPI = {
  uploadImage: (formData) => api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// SuperAdmin
export const superadminAPI = {
  getStats: () => api.get('/superadmin/stats'),
  getRestaurants: (params) => api.get('/superadmin/restaurants', { params }),
  createRestaurant: (data) => api.post('/superadmin/restaurants', data),
  updateRestaurant: (id, data) => api.put(`/superadmin/restaurants/${id}`, data),
  deleteRestaurant: (id) => api.delete(`/superadmin/restaurants/${id}`),
  updateSubscription: (id, data) => api.put(`/superadmin/restaurants/${id}/subscription`, data),
  getQRCodes: (id) => api.get(`/superadmin/restaurants/${id}/qrcodes`),
  getUsers: () => api.get('/superadmin/users'),
};

export default api;
