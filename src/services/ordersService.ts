import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define the Order interface
export interface Order {
  id: string;
  userId: string;
  exchangeId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  status: 'new' | 'filled' | 'partially_filled' | 'canceled' | 'rejected';
  price?: number;
  stopPrice?: number;
  quantity: number;
  filledQuantity: number;
  avgFillPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define the CreateOrderDto
export interface CreateOrderDto {
  exchangeId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  price?: number;
  stopPrice?: number;
  quantity: number;
}

/**
 * Place a new order
 */
export const placeOrder = async (
  createOrderDto: CreateOrderDto,
): Promise<Order> => {
  try {
    const response = await api.post<Order>('/orders', createOrderDto);
    return response.data;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};

/**
 * Get all orders for the current user
 */
export const getOrders = async (
  exchangeId?: string,
  symbol?: string,
  status?: string,
): Promise<Order[]> => {
  try {
    const params: Record<string, string> = {};
    if (exchangeId) params.exchangeId = exchangeId;
    if (symbol) params.symbol = symbol;
    if (status) params.status = status;

    const response = await api.get<Order[]>('/orders', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

/**
 * Get a specific order by ID
 */
export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const response = await api.get<Order>(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    return null;
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const response = await api.delete<Order>(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`Error canceling order ${orderId}:`, error);
    return null;
  }
};
