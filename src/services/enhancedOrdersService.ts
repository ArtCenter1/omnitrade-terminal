import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/lib/api';
import { useFeatureFlags } from '@/config/featureFlags';
import * as enhancedCoinGeckoService from './enhancedCoinGeckoService';

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

// Mock orders for testing
const mockOrders: Order[] = [];

// Add a mock order
const addMockOrder = (order: Order) => {
  console.log('Adding mock order to mockOrders array:', order);
  mockOrders.push(order);
  console.log('mockOrders array now has', mockOrders.length, 'orders');
};

/**
 * Validate an order against real market data
 */
export const validateOrder = async (
  createOrderDto: CreateOrderDto,
  useMockData: boolean = false,
  useRealMarketData: boolean = false,
): Promise<{ valid: boolean; message?: string }> => {
  try {
    const { symbol, side, type, price, quantity } = createOrderDto;

    // Basic validation
    if (!symbol) {
      return { valid: false, message: 'Symbol is required' };
    }

    if (!side) {
      return { valid: false, message: 'Side is required' };
    }

    if (!type) {
      return { valid: false, message: 'Order type is required' };
    }

    if (quantity <= 0) {
      return { valid: false, message: 'Quantity must be greater than 0' };
    }

    if (type === 'limit' && (!price || price <= 0)) {
      return {
        valid: false,
        message: 'Price must be greater than 0 for limit orders',
      };
    }

    // If using mock data, skip further validation
    if (useMockData && !useRealMarketData) {
      return { valid: true };
    }

    // Get real market data for validation
    try {
      // Parse the symbol to get base and quote assets
      const [baseAsset, quoteAsset] = symbol.split('/');

      // Get the current price
      const currentPrice = await enhancedCoinGeckoService.getCurrentPrice(
        baseAsset,
        quoteAsset,
      );

      if (currentPrice <= 0) {
        return {
          valid: false,
          message: 'Could not get current price for this trading pair',
        };
      }

      // For limit orders, validate the price
      if (type === 'limit' && price) {
        // Check if the price is within a reasonable range (e.g., ±20% of current price)
        const minPrice = currentPrice * 0.8;
        const maxPrice = currentPrice * 1.2;

        if (price < minPrice || price > maxPrice) {
          return {
            valid: false,
            message: `Price ${price} is outside the reasonable range (${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)})`,
          };
        }
      }

      // Get the orderbook to validate quantity
      const orderbook = await enhancedCoinGeckoService.getOrderbook(
        symbol,
        createOrderDto.exchangeId,
      );

      // Calculate the total value of the order
      const orderValue = quantity * (price || currentPrice);

      // Check if the order value is reasonable (e.g., > $10)
      if (orderValue < 10) {
        return {
          valid: false,
          message: 'Order value is too small (minimum $10)',
        };
      }

      // For market orders, check if there's enough liquidity
      if (type === 'market') {
        let availableLiquidity = 0;

        if (side === 'buy') {
          // For buy orders, check the asks
          for (const ask of orderbook.asks) {
            availableLiquidity += parseFloat(ask[1]);
          }
        } else {
          // For sell orders, check the bids
          for (const bid of orderbook.bids) {
            availableLiquidity += parseFloat(bid[1]);
          }
        }

        if (quantity > availableLiquidity) {
          return {
            valid: false,
            message: `Not enough liquidity for this order (available: ${availableLiquidity.toFixed(8)})`,
          };
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating order with real market data:', error);
      // If validation with real data fails, allow the order to proceed
      return {
        valid: true,
        message: 'Warning: Could not validate with real market data',
      };
    }
  } catch (error) {
    console.error('Error validating order:', error);
    return {
      valid: false,
      message: 'An unexpected error occurred during validation',
    };
  }
};

/**
 * Place a new order
 */
export const placeOrder = async (
  createOrderDto: CreateOrderDto,
): Promise<Order> => {
  try {
    console.log('placeOrder called with:', createOrderDto);

    // Get feature flags
    const featureFlags =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('omnitrade_feature_flags') || '{}')
        : {};

    const useMockData =
      featureFlags.useMockData !== undefined ? featureFlags.useMockData : true;

    const useRealMarketData =
      featureFlags.useRealMarketData !== undefined
        ? featureFlags.useRealMarketData
        : false;

    console.log('Feature flags:', { useMockData, useRealMarketData });

    // Validate the order
    const validation = await validateOrder(
      createOrderDto,
      useMockData,
      useRealMarketData,
    );
    console.log('Order validation result:', validation);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    try {
      // Try to place the order through the API
      console.log(
        'Attempting to place order via API at:',
        `${api.defaults.baseURL}/orders`,
      );

      // Set proper headers for the API call
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
      };

      // Make the API call to place the order with proper error handling
      try {
        const response = await api.post<Order>('/orders', createOrderDto, {
          headers,
        });
        console.log('API order placement successful:', response.data);
        return response.data;
      } catch (error) {
        // Check if it's a network error
        if (!error.response) {
          console.error('Network error when placing order:', error);
          throw new Error(
            'Network error. Please check your connection and try again.',
          );
        }

        // Check if it's an authentication error
        if (error.response.status === 401) {
          console.error(
            'Authentication error when placing order:',
            error.response.data,
          );
          throw new Error('Authentication failed. Please log in again.');
        }

        // Handle other API errors
        console.error(
          'API error when placing order:',
          error.response?.data || error,
        );
        throw new Error(
          error.response?.data?.message ||
            'Failed to place order. Please try again.',
        );
      }
    } catch (apiError) {
      console.error('Error placing order:', apiError);

      // Check if this is a network error or server unavailable error
      // Only fall back to mock implementation as a last resort
      const isNetworkError =
        !apiError.response ||
        apiError.code === 'ECONNREFUSED' ||
        apiError.message.includes('Network Error');

      // Log the error for debugging
      console.error('API error details:', {
        message: apiError.message,
        code: apiError.code,
        hasResponse: !!apiError.response,
        status: apiError.response?.status,
      });

      // Fall back to mock implementation only for network errors
      if (isNetworkError) {
        console.log('Falling back to mock implementation due to error');
        console.log('Creating mock order...');
        const mockOrder: Order = {
          id: uuidv4(),
          userId: 'mock-user',
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
        console.log('Mock order created and added to mock orders:', mockOrder);
        console.log('Current mock orders:', mockOrders);

        // For market orders, simulate immediate fill after a delay
        if (createOrderDto.type === 'market') {
          console.log('Scheduling market order fill in 2 seconds...');
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
      } else {
        // In production mode, throw the error to be handled by the UI
        console.log('Not a network error, propagating to UI for handling');
        throw apiError;
      }
    }
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};

/**
 * Get all orders
 */
export const getOrders = async (
  exchangeId?: string,
  symbol?: string,
  status?: string,
): Promise<Order[]> => {
  try {
    try {
      // Build query parameters
      const params: Record<string, string> = {};
      if (exchangeId) params.exchangeId = exchangeId;
      if (symbol) params.symbol = symbol;
      if (status) params.status = status;

      const response = await api.get<Order[]>('/orders', { params });
      return response.data;
    } catch (apiError) {
      console.error(
        'API error getting orders, using mock implementation:',
        apiError,
      );

      // Filter mock orders based on parameters
      return mockOrders.filter((order) => {
        if (exchangeId && order.exchangeId !== exchangeId) return false;
        if (symbol && order.symbol !== symbol) return false;
        if (status && order.status !== status) return false;
        return true;
      });
    }
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId: string): Promise<boolean> => {
  try {
    try {
      await api.delete(`/orders/${orderId}`);
      return true;
    } catch (apiError) {
      console.error(
        'API error canceling order, using mock implementation:',
        apiError,
      );

      // Find the order in mock orders
      const index = mockOrders.findIndex((order) => order.id === orderId);
      if (index !== -1) {
        mockOrders[index] = {
          ...mockOrders[index],
          status: 'canceled',
          updatedAt: new Date(),
        };
        return true;
      }

      return false;
    }
  } catch (error) {
    console.error('Error canceling order:', error);
    throw error;
  }
};
