import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';

export function useOrders(params = {}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => ordersAPI.getOrders(params).then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: params.live ? 15_000 : false,
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersAPI.getOrder(id).then((r) => r.data),
    enabled: !!id,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

export function useLiveOrders() {
  return useQuery({
    queryKey: ['orders', 'live'],
    queryFn: () => ordersAPI.getLiveOrders().then((r) => r.data),
    refetchInterval: 8_000,
    staleTime: 5_000,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => ordersAPI.updateStatus(id, status),
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success(`Order status: ${status}`);
    },
    onError: () => toast.error('Failed to update status'),
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderData) => ordersAPI.placeOrder(orderData).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to place order';
      toast.error(msg);
    },
  });
}

export function useCustomerHistory(phone, restaurantId) {
  return useQuery({
    queryKey: ['customer-history', phone, restaurantId],
    queryFn: () => ordersAPI.getCustomerHistory(phone, restaurantId).then((r) => r.data),
    enabled: !!phone && !!restaurantId,
    staleTime: 60_000,
  });
}
