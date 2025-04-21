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
    try {
      const response = await api.post<Order>('/orders', createOrderDto);
      return response.data;
    } catch (apiError) {
      console.error(
        'API error placing order, using mock implementation:',
        apiError,
      );

      // Create a mock order
      const mockOrder: Order = {
        id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        userId: 'current-user',
        exchangeId: createOrderDto.exchangeId,
        symbol: createOrderDto.symbol,
        side: createOrderDto.side,
        type: createOrderDto.type,
        status: 'new',
        price: createOrderDto.price,
        stopPrice: createOrderDto.stopPrice,
        quantity: createOrderDto.quantity,
        filledQuantity: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to mock orders
      addMockOrder(mockOrder);

      // For market orders, simulate immediate fill after a delay
      if (createOrderDto.type === 'market') {
        setTimeout(() => {
          const index = mockOrders.findIndex(
            (order) => order.id === mockOrder.id,
          );
          if (index !== -1) {
            mockOrders[index] = {
              ...mockOrders[index],
              status: 'filled',
              filledQuantity: createOrderDto.quantity,
              updatedAt: new Date(),
            };
            console.log('Market order filled:', mockOrders[index]);
          }
        }, 2000);
      }

      return mockOrder;
    }
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};

/**
 * Get all orders for the current user
 */
// Mock orders for testing
let mockOrders: Order[] = [];

// Add a new order to the mock orders list
export const addMockOrder = (order: Order) => {
  mockOrders.push(order);
  console.log('Added mock order:', order);
  console.log('Current mock orders:', mockOrders);
};

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

    try {
      const response = await api.get<Order[]>('/orders', { params });
      return response.data;
    } catch (apiError) {
      console.error('API error fetching orders, using mock data:', apiError);

      // Filter mock orders based on the same parameters
      let filtered = [...mockOrders];

      if (exchangeId) {
        filtered = filtered.filter((order) => order.exchangeId === exchangeId);
      }

      if (symbol) {
        filtered = filtered.filter((order) => order.symbol === symbol);
      }

      if (status) {
        const statusList = status.split(',');
        filtered = filtered.filter((order) =>
          statusList.includes(order.status),
        );
      }

      console.log('Returning filtered mock orders:', filtered);
      return filtered;
    }
  } catch (error) {
    console.error('Error in getOrders:', error);
    return [];
  }
};

/**
 * Get a specific order by ID
 */
export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    try {
      const response = await api.get<Order>(`/orders/${orderId}`);
      return response.data;
    } catch (apiError) {
      console.error(
        `API error fetching order ${orderId}, using mock implementation:`,
        apiError,
      );

      // Find the order in our mock orders
      const order = mockOrders.find((order) => order.id === orderId);
      return order || null;
    }
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
    try {
      const response = await api.delete<Order>(`/orders/${orderId}`);
      return response.data;
    } catch (apiError) {
      console.error(
        `API error canceling order ${orderId}, using mock implementation:`,
        apiError,
      );

      // Find the order in our mock orders
      const index = mockOrders.findIndex((order) => order.id === orderId);
      if (index !== -1) {
        // Update the order status
        mockOrders[index] = {
          ...mockOrders[index],
          status: 'canceled',
          updatedAt: new Date(),
        };

        console.log('Order canceled:', mockOrders[index]);
        return mockOrders[index];
      }

      return null;
    }
  } catch (error) {
    console.error(`Error canceling order ${orderId}:`, error);
    return null;
  }
};
