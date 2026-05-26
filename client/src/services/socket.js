import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socket;
};

export const connectSocket = (token) => {
  const s = getSocket();
  if (token) {
    s.auth = { token };
  }
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

export const joinRoom = (room) => {
  const s = getSocket();
  if (s.connected) {
    s.emit('join-restaurant', room);
  }
};

export const joinKitchen = (restaurantId) => {
  const s = getSocket();
  if (s.connected) {
    s.emit('join-kitchen', restaurantId);
  }
};

export const emitOrderPlaced = (restaurantId, orderData) => {
  getSocket().emit('order-placed', restaurantId, orderData);
};

export const emitStatusChange = (restaurantId, orderId, status) => {
  getSocket().emit('order-status-change', restaurantId, orderId, status);
};

export default getSocket;
