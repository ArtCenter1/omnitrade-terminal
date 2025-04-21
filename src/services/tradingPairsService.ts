// This file is deprecated and will be removed in a future update.
// Please use tradingService.ts instead.

import { io, Socket } from 'socket.io-client';

// Re-export everything from the new service
export * from './tradingService';

// Dummy socket for backward compatibility
let socket: Socket | null = null;

// Dummy function for backward compatibility
export const initializeTradingSocket = (): Socket => {
  if (socket) return socket;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // Return a dummy socket
  return io(`${apiUrl}/trading`, {
    transports: ['websocket'],
    autoConnect: false,
  });
};
