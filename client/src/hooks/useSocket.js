import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Subscribe to a socket event and clean up automatically.
 */
export function useSocketEvent(event, handler, deps = []) {
  const { on } = useSocket();

  useEffect(() => {
    if (!on || !event) return;
    const off = on(event, handler);
    return () => off?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}

/**
 * Join a socket room on mount and leave on unmount.
 */
export function useSocketRoom(room) {
  const { joinRoom } = useSocket();
  useEffect(() => {
    if (!room) return;
    joinRoom?.(room);
  }, [room]);
}

/**
 * Composite hook: join a restaurant room and subscribe to order events.
 */
export function useOrderSocket(restaurantId, { onNewOrder, onStatusUpdate } = {}) {
  const { on, joinRoom } = useSocket();

  useEffect(() => {
    if (!restaurantId) return;
    joinRoom?.(`restaurant-${restaurantId}`);
  }, [restaurantId]);

  useEffect(() => {
    if (!on) return;
    const offNew = onNewOrder ? on('new-order', onNewOrder) : null;
    const offStatus = onStatusUpdate ? on('order-status-updated', onStatusUpdate) : null;
    return () => {
      offNew?.();
      offStatus?.();
    };
  }, [onNewOrder, onStatusUpdate]);
}

export default useSocketEvent;
