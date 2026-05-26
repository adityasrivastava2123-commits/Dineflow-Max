import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL || 'https://dineflow-max.onrender.com/api')
    .replace('/api', '');

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const joinRoom = (room) =>
    socketRef.current?.emit('join-restaurant', room);

  const joinKitchen = (room) =>
    socketRef.current?.emit('join-kitchen', room);

  const joinOrder = (orderId) =>
    socketRef.current?.emit('join-order', orderId);

  const on = (event, cb) => {
    socketRef.current?.on(event, cb);
    return () => socketRef.current?.off(event, cb);
  };

  const off = (event, cb) => {
    socketRef.current?.off(event, cb);
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        joinRoom,
        joinKitchen,
        joinOrder,
        on,
        off
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
