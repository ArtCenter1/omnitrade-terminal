import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/lib/api';
import { useFeatureFlags } from '@/config/featureFlags';
import * as optimizedCoinGeckoService from './optimizedCoinGeckoService';
import { mockExchangeService } from './mockExchangeService';
import logger from '@/utils/logger';
import { ExchangeFactory } from './exchange/exchangeFactory';
import { getConnectionMode } from '@/config/exchangeConfig';

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
// Use a more persistent approach with localStorage to prevent orders from being lost on page refresh
export const getMockOrders = (): Order[] => {
  try {
    console.log('Getting mock orders from localStorage');
    const storedOrders = localStorage.getItem('omnitrade_mock_orders');

    if (storedOrders) {
      console.log('Found stored orders in localStorage');

      try {
        // Parse the stored orders and convert date strings back to Date objects
        const parsedOrders = JSON.parse(storedOrders);
        console.log(
          `Successfully parsed ${parsedOrders.length} orders from localStorage`,
        );

        const orders = parsedOrders.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        }));

        console.log('Returning orders with converted dates:', orders);
        return orders;
      } catch (parseError) {
        console.error('Error parsing orders JSON:', parseError);
        console.log('Invalid JSON:', storedOrders);

        // If there's an error parsing the JSON, clear the localStorage item
        localStorage.removeItem('omnitrade_mock_orders');
        console.log('Cleared invalid orders from localStorage');

        return [];
      }
    } else {
      console.log('No stored orders found in localStorage');
    }
  } catch (error) {
    console.error('Error retrieving mock orders from localStorage:', error);
  }

  console.log('Returning empty orders array');
  return [];
};

// Save mock orders to localStorage
export const saveMockOrders = (orders: Order[]) => {
  try {
    console.log(`Saving ${orders.length} mock orders to localStorage`);

    // Create a serializable version of the orders
    const serializableOrders = orders.map((order) => ({
      ...order,
      // Ensure dates are serialized as ISO strings
      createdAt:
        order.createdAt instanceof Date
          ? order.createdAt.toISOString()
          : order.createdAt,
      updatedAt:
        order.updatedAt instanceof Date
          ? order.updatedAt.toISOString()
          : order.updatedAt,
    }));

    const ordersJson = JSON.stringify(serializableOrders);
    localStorage.setItem('omnitrade_mock_orders', ordersJson);

    console.log('Successfully saved orders to localStorage');

    // Verify the save was successful
    const savedOrders = localStorage.getItem('omnitrade_mock_orders');
    if (savedOrders) {
      console.log(
        `Verified ${JSON.parse(savedOrders).length} orders in localStorage`,
      );
    } else {
      console.error(
        'Failed to verify saved orders - localStorage item is null',
      );
    }
  } catch (error) {
    console.error('Error saving mock orders to localStorage:', error);
  }
};

// Get the current mock orders - initialize as empty array and populate later
export const mockOrders: Order[] = [];

// Initialize mock orders from localStorage
(function initializeMockOrders() {
  try {
    const storedOrders = localStorage.getItem('omnitrade_mock_orders');
    if (storedOrders) {
      const parsedOrders = JSON.parse(storedOrders);
      console.log(
        `Initializing mockOrders with ${parsedOrders.length} orders from localStorage`,
      );

      // Convert date strings to Date objects
      const orders = parsedOrders.map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
      }));

      // Clear and repopulate the mockOrders array
      mockOrders.length = 0;
      mockOrders.push(...orders);
      console.log('mockOrders initialized:', mockOrders);
    }
  } catch (error) {
    console.error('Error initializing mock orders from localStorage:', error);
  }
})();

// Add a mock order
export const addMockOrder = (order: Order) => {
  console.log('Adding mock order to mockOrders array:', order);

  // Get the latest orders from localStorage to avoid overwriting other orders
  const currentOrders = getMockOrders();
  console.log(
    `Retrieved ${currentOrders.length} existing orders from localStorage`,
  );

  // Add the new order
  currentOrders.push(order);
  console.log(`Added new order. Total orders: ${currentOrders.length}`);

  // Update the in-memory array
  mockOrders.length = 0; // Clear the array
  mockOrders.push(...currentOrders); // Add all orders back
  console.log('Updated in-memory mockOrders array');

  // Save the updated orders to localStorage
  saveMockOrders(currentOrders);
  console.log('Saved updated orders to localStorage');

  // Return the updated orders array
  return currentOrders;
};

// Helper function to create a mock order directly
export const createMockOrder = (createOrderDto: CreateOrderDto): Order => {
  logger.info('Creating mock order directly', {
    component: 'enhancedOrdersService',
    method: 'createMockOrder',
    data: {
      createOrderDto,
      timestamp: new Date().toISOString(),
    },
  });

  // Ensure the symbol is in the correct format (BASE/QUOTE)
  let symbol = createOrderDto.symbol;
  if (!symbol.includes('/')) {
    // Try to infer the format from the symbol (e.g., BTCUSDT -> BTC/USDT)
    // This is a simple heuristic and might not work for all symbols
    const commonQuoteAssets = ['USDT', 'USD', 'BTC', 'ETH', 'BNB'];
    for (const quote of commonQuoteAssets) {
      if (symbol.endsWith(quote)) {
        const base = symbol.slice(0, -quote.length);
        symbol = `${base}/${quote}`;
        logger.debug('Reformatted symbol', {
          component: 'enhancedOrdersService',
          method: 'createMockOrder',
          data: {
            originalSymbol: createOrderDto.symbol,
            formattedSymbol: symbol,
          },
        });
        break;
      }
    }
  }

  logger.debug('Using symbol for mock order', {
    component: 'enhancedOrdersService',
    method: 'createMockOrder',
    data: { symbol },
  });

  // If price is not provided for a market order, get it from our centralized mock exchange service
  if (
    createOrderDto.type === 'market' &&
    (!createOrderDto.price || createOrderDto.price <= 0)
  ) {
    logger.debug('Getting price from mockExchangeService for market order', {
      component: 'enhancedOrdersService',
      method: 'createMockOrder',
      data: {
        exchangeId: createOrderDto.exchangeId,
        symbol,
      },
    });

    const currentPrice = mockExchangeService.getCurrentPrice(
      createOrderDto.exchangeId,
      symbol,
    );

    logger.debug('Using current price from mockExchangeService', {
      component: 'enhancedOrdersService',
      method: 'createMockOrder',
      data: { currentPrice },
    });

    createOrderDto.price = parseFloat(currentPrice);
  }

  // Generate a unique ID for the order
  const orderId = uuidv4();
  logger.debug('Generated order ID', {
    component: 'enhancedOrdersService',
    method: 'createMockOrder',
    data: { orderId },
  });

  const mockOrder: Order = {
    id: orderId,
    userId: 'mock-user',
    exchangeId: createOrderDto.exchangeId,
    symbol: symbol,
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
  logger.debug('Adding mock order to mock orders', {
    component: 'enhancedOrdersService',
    method: 'createMockOrder',
    data: { mockOrder },
  });

  addMockOrder(mockOrder);

  logger.info('Mock order created and added to mock orders', {
    component: 'enhancedOrdersService',
    method: 'createMockOrder',
    data: {
      mockOrder,
      orderId: mockOrder.id,
      status: 'created',
    },
  });

  // For market orders, simulate immediate fill after a delay
  if (createOrderDto.type === 'market') {
    logger.debug('Scheduling market order fill in 2 seconds', {
      component: 'enhancedOrdersService',
      method: 'createMockOrder',
      data: { orderId: mockOrder.id },
    });

    setTimeout(() => {
      logger.debug('Executing scheduled market order fill', {
        component: 'enhancedOrdersService',
        method: 'createMockOrder',
        data: { orderId: mockOrder.id },
      });

      // Get the latest mock orders
      const currentMockOrders = getMockOrders();

      logger.debug('Retrieved current mock orders for filling', {
        component: 'enhancedOrdersService',
        method: 'createMockOrder',
        data: { count: currentMockOrders.length },
      });

      // Find the order in the current mock orders
      const index = currentMockOrders.findIndex(
        (order) => order.id === mockOrder.id,
      );

      if (index !== -1) {
        logger.debug('Found order to fill', {
          component: 'enhancedOrdersService',
          method: 'createMockOrder',
          data: {
            orderId: mockOrder.id,
            orderIndex: index,
            orderBeforeUpdate: currentMockOrders[index],
          },
        });

        // Update the order
        currentMockOrders[index] = {
          ...currentMockOrders[index],
          status: 'filled',
          filledQuantity: createOrderDto.quantity,
          updatedAt: new Date(),
        };

        // Save the updated orders back to localStorage
        logger.debug('Saving updated orders to localStorage', {
          component: 'enhancedOrdersService',
          method: 'createMockOrder',
          data: { count: currentMockOrders.length },
        });

        saveMockOrders(currentMockOrders);

        logger.info('Market order filled', {
          component: 'enhancedOrdersService',
          method: 'createMockOrder',
          data: {
            filledOrder: currentMockOrders[index],
            orderId: mockOrder.id,
            status: 'filled',
          },
        });
      } else {
        logger.error('Could not find order to fill', {
          component: 'enhancedOrdersService',
          method: 'createMockOrder',
          data: {
            orderId: mockOrder.id,
            availableOrderIds: currentMockOrders.map((o) => o.id),
          },
        });
      }
    }, 2000);
  }

  return mockOrder;
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
      const currentPrice = await optimizedCoinGeckoService.getCurrentPrice(
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
      const orderbook = await optimizedCoinGeckoService.getOrderbook(
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
    logger.info('placeOrder called', {
      component: 'enhancedOrdersService',
      method: 'placeOrder',
      data: {
        createOrderDto,
        timestamp: new Date().toISOString(),
      },
    });

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

    // In development mode, always use mock implementation for easier testing
    const forceMockImplementation = process.env.NODE_ENV === 'development';

    logger.debug('Feature flags', {
      component: 'enhancedOrdersService',
      method: 'placeOrder',
      data: {
        useMockData,
        useRealMarketData,
        forceMockImplementation,
        nodeEnv: process.env.NODE_ENV,
      },
    });

    // If we're forcing mock implementation, create a mock order directly
    if (forceMockImplementation) {
      logger.info('Forcing mock implementation in development mode', {
        component: 'enhancedOrdersService',
        method: 'placeOrder',
      });
      return createMockOrder(createOrderDto);
    }

    // Validate the order
    logger.debug('Validating order', {
      component: 'enhancedOrdersService',
      method: 'placeOrder',
      data: { createOrderDto },
    });

    const validation = await validateOrder(
      createOrderDto,
      useMockData,
      useRealMarketData,
    );

    logger.debug('Order validation result', {
      component: 'enhancedOrdersService',
      method: 'placeOrder',
      data: { validation },
    });

    if (!validation.valid) {
      logger.warn('Order validation failed', {
        component: 'enhancedOrdersService',
        method: 'placeOrder',
        data: {
          message: validation.message,
          createOrderDto,
        },
      });
      throw new Error(validation.message);
    }

    try {
      // Try to place the order through the API
      logger.debug('Attempting to place order via API', {
        component: 'enhancedOrdersService',
        method: 'placeOrder',
        data: { apiUrl: `${api.defaults.baseURL}/orders` },
      });

      // Set proper headers for the API call
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
      };

      // Make the API call to place the order with proper error handling
      try {
        logger.debug('Making API call to place order', {
          component: 'enhancedOrdersService',
          method: 'placeOrder',
          data: { createOrderDto, headers },
        });

        const startTime = Date.now();
        const response = await api.post<Order>('/orders', createOrderDto, {
          headers,
        });
        const endTime = Date.now();

        logger.info('API order placement successful', {
          component: 'enhancedOrdersService',
          method: 'placeOrder',
          data: {
            response: response.data,
            executionTimeMs: endTime - startTime,
            orderId: response.data.id,
            status: 'success',
          },
        });

        return response.data;
      } catch (error) {
        // Safely extract error information
        const errorObj = error as any;
        logger.error('Error details in API call', {
          component: 'enhancedOrdersService',
          method: 'placeOrder',
          data: {
            name: errorObj?.name,
            message: errorObj?.message,
            code: errorObj?.code,
            status: errorObj?.response?.status,
            responseData: errorObj?.response?.data,
          },
        });

        // Check if it's a network error
        if (!errorObj?.response) {
          logger.error('Network error when placing order', {
            component: 'enhancedOrdersService',
            method: 'placeOrder',
            data: { error },
          });
          throw new Error(
            'Network error. Please check your connection and try again.',
          );
        }

        // Check if it's an authentication error
        if (errorObj?.response?.status === 401) {
          logger.error('Authentication error when placing order', {
            component: 'enhancedOrdersService',
            method: 'placeOrder',
            data: { responseData: errorObj?.response?.data },
          });
          throw new Error('Authentication failed. Please log in again.');
        }

        // Handle other API errors
        logger.error('API error when placing order', {
          component: 'enhancedOrdersService',
          method: 'placeOrder',
          data: { responseData: errorObj?.response?.data || error },
        });
        throw new Error(
          errorObj?.response?.data?.message ||
            'Failed to place order. Please try again.',
        );
      }
    } catch (apiError) {
      logger.error('Error placing order', {
        component: 'enhancedOrdersService',
        method: 'placeOrder',
        data: { apiError },
      });

      // Safely extract error information
      const errorObj = apiError as any;

      // Check if this is a network error or server unavailable error
      // Only fall back to mock implementation as a last resort
      // In development, we'll always use the mock implementation for easier testing
      const isNetworkError =
        process.env.NODE_ENV === 'development' ||
        !errorObj?.response ||
        errorObj?.code === 'ECONNREFUSED' ||
        errorObj?.message?.includes('Network Error') ||
        (errorObj?.message && errorObj?.message.includes('ECONNREFUSED'));

      // Log the error for debugging
      logger.error('API error details', {
        component: 'enhancedOrdersService',
        method: 'placeOrder',
        data: {
          message: errorObj?.message || 'Unknown error',
          code: errorObj?.code,
          hasResponse: !!errorObj?.response,
          status: errorObj?.response?.status,
          name: errorObj?.name,
          stack: errorObj?.stack?.substring(0, 200), // Only log the first part of the stack trace
        },
      });

      // Fall back to mock implementation only for network errors
      if (isNetworkError) {
        logger.info('Falling back to mock implementation due to error', {
          component: 'enhancedOrdersService',
          method: 'placeOrder',
        });

        logger.debug('Creating mock order', {
          component: 'enhancedOrdersService',
          method: 'placeOrder',
          data: { createOrderDto },
        });

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
        logger.debug('Adding mock order to mock orders', {
          component: 'enhancedOrdersService',
          method: 'placeOrder',
          data: { mockOrder },
        });

        addMockOrder(mockOrder);

        logger.info('Mock order created and added to mock orders', {
          component: 'enhancedOrdersService',
          method: 'placeOrder',
          data: {
            mockOrder,
            orderId: mockOrder.id,
            status: 'created',
          },
        });

        // For market orders, simulate immediate fill after a delay
        if (createOrderDto.type === 'market') {
          logger.debug('Scheduling market order fill in 2 seconds', {
            component: 'enhancedOrdersService',
            method: 'placeOrder',
            data: { orderId: mockOrder.id },
          });

          setTimeout(() => {
            logger.debug('Executing scheduled market order fill', {
              component: 'enhancedOrdersService',
              method: 'placeOrder',
              data: { orderId: mockOrder.id },
            });

            // Get the latest mock orders
            const currentMockOrders = getMockOrders();

            logger.debug('Retrieved current mock orders for filling', {
              component: 'enhancedOrdersService',
              method: 'placeOrder',
              data: { count: currentMockOrders.length },
            });

            // Find the order in the current mock orders
            const index = currentMockOrders.findIndex(
              (order) => order.id === mockOrder.id,
            );

            if (index !== -1) {
              logger.debug('Found order to fill', {
                component: 'enhancedOrdersService',
                method: 'placeOrder',
                data: {
                  orderId: mockOrder.id,
                  orderIndex: index,
                  orderBeforeUpdate: currentMockOrders[index],
                },
              });

              // Update the order
              currentMockOrders[index] = {
                ...currentMockOrders[index],
                status: 'filled',
                filledQuantity: createOrderDto.quantity,
                updatedAt: new Date(),
              };

              // Save the updated orders back to localStorage
              logger.debug('Saving updated orders to localStorage', {
                component: 'enhancedOrdersService',
                method: 'placeOrder',
                data: { count: currentMockOrders.length },
              });

              saveMockOrders(currentMockOrders);

              logger.info('Market order filled', {
                component: 'enhancedOrdersService',
                method: 'placeOrder',
                data: {
                  filledOrder: currentMockOrders[index],
                  orderId: mockOrder.id,
                  status: 'filled',
                },
              });
            } else {
              logger.error('Could not find order to fill', {
                component: 'enhancedOrdersService',
                method: 'placeOrder',
                data: {
                  orderId: mockOrder.id,
                  availableOrderIds: currentMockOrders.map((o) => o.id),
                },
              });
            }
          }, 2000);
        }

        return mockOrder;
      } else {
        // In production mode, throw the error to be handled by the UI
        logger.warn('Not a network error, propagating to UI for handling', {
          component: 'enhancedOrdersService',
          method: 'placeOrder',
          data: { apiError },
        });
        throw apiError;
      }
    }
  } catch (error) {
    logger.error('Error placing order', {
      component: 'enhancedOrdersService',
      method: 'placeOrder',
      data: { error },
    });
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
    // Get feature flags
    const featureFlags =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('omnitrade_feature_flags') || '{}')
        : {};

    const useBinanceTestnet =
      featureFlags.useBinanceTestnet !== undefined
        ? featureFlags.useBinanceTestnet
        : false;

    // Check if we're in sandbox mode and Binance Testnet is enabled
    const connectionMode = getConnectionMode();
    const isSandbox = connectionMode === 'sandbox';

    // If we're in sandbox mode and Binance Testnet is enabled, use the Binance Testnet adapter
    if (isSandbox && useBinanceTestnet && exchangeId === 'sandbox') {
      exchangeId = 'binance_testnet';
    }

    logger.debug('Getting orders', {
      component: 'enhancedOrdersService',
      method: 'getOrders',
      data: {
        exchangeId,
        symbol,
        status,
        connectionMode,
        useBinanceTestnet,
      },
    });

    try {
      // Try to use the API first
      const params: Record<string, string> = {};
      if (exchangeId) params.exchangeId = exchangeId;
      if (symbol) params.symbol = symbol;
      if (status) params.status = status;

      const response = await api.get<Order[]>('/orders', { params });
      return response.data;
    } catch (apiError) {
      logger.info('API error getting orders, trying exchange adapter', {
        component: 'enhancedOrdersService',
        method: 'getOrders',
        data: { error: apiError },
      });

      // Try to use the exchange adapter if available
      try {
        if (exchangeId) {
          const adapter = ExchangeFactory.getAdapter(exchangeId);

          // Parse status for the adapter
          let statusArray: string[] | undefined;
          if (status) {
            statusArray = status.split(',');
          }

          // Get open orders if status includes 'new' or 'partially_filled'
          if (
            statusArray &&
            (statusArray.includes('new') ||
              statusArray.includes('partially_filled'))
          ) {
            logger.debug('Getting open orders from adapter', {
              component: 'enhancedOrdersService',
              method: 'getOrders',
              data: { exchangeId, symbol },
            });

            // Use 'default' as the API key ID for now
            const openOrders = await adapter.getOpenOrders('default', symbol);

            logger.debug('Got open orders from adapter', {
              component: 'enhancedOrdersService',
              method: 'getOrders',
              data: { count: openOrders.length },
            });

            return openOrders;
          }

          // Get order history if no status filter or status includes other statuses
          logger.debug('Getting order history from adapter', {
            component: 'enhancedOrdersService',
            method: 'getOrders',
            data: { exchangeId, symbol },
          });

          // Use 'default' as the API key ID for now
          const orderHistory = await adapter.getOrderHistory('default', symbol);

          logger.debug('Got order history from adapter', {
            component: 'enhancedOrdersService',
            method: 'getOrders',
            data: { count: orderHistory.length },
          });

          return orderHistory;
        }
      } catch (adapterError) {
        logger.error('Error getting orders from adapter', {
          component: 'enhancedOrdersService',
          method: 'getOrders',
          data: { error: adapterError },
        });
      }

      // Fall back to mock orders from localStorage
      logger.info('Falling back to mock orders from localStorage', {
        component: 'enhancedOrdersService',
        method: 'getOrders',
      });

      // Get the latest mock orders from localStorage
      const latestMockOrders = getMockOrders();

      logger.debug('Retrieved mock orders for filtering', {
        component: 'enhancedOrdersService',
        method: 'getOrders',
        data: { count: latestMockOrders.length },
      });

      // Filter mock orders based on parameters
      const filteredOrders = latestMockOrders.filter((order) => {
        if (exchangeId && order.exchangeId !== exchangeId) return false;
        if (symbol && order.symbol !== symbol) return false;

        // Handle status filtering with comma-separated values
        if (status) {
          const statusList = status.split(',');
          if (!statusList.includes(order.status)) return false;
        }

        return true;
      });

      logger.debug('Filtered mock orders', {
        component: 'enhancedOrdersService',
        method: 'getOrders',
        data: { count: filteredOrders.length },
      });

      return filteredOrders;
    }
  } catch (error) {
    logger.error('Error getting orders', {
      component: 'enhancedOrdersService',
      method: 'getOrders',
      data: { error },
    });
    throw error;
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (
  orderId: string,
  exchangeId?: string,
  symbol?: string,
): Promise<boolean> => {
  try {
    // Get feature flags
    const featureFlags =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('omnitrade_feature_flags') || '{}')
        : {};

    const useBinanceTestnet =
      featureFlags.useBinanceTestnet !== undefined
        ? featureFlags.useBinanceTestnet
        : false;

    // Check if we're in sandbox mode and Binance Testnet is enabled
    const connectionMode = getConnectionMode();
    const isSandbox = connectionMode === 'sandbox';

    // If we're in sandbox mode and Binance Testnet is enabled, use the Binance Testnet adapter
    if (isSandbox && useBinanceTestnet && exchangeId === 'sandbox') {
      exchangeId = 'binance_testnet';
    }

    logger.debug('Canceling order', {
      component: 'enhancedOrdersService',
      method: 'cancelOrder',
      data: {
        orderId,
        exchangeId,
        symbol,
        connectionMode,
        useBinanceTestnet,
      },
    });

    try {
      // Try to use the API first
      await api.delete(`/orders/${orderId}`);
      return true;
    } catch (apiError) {
      logger.info('API error canceling order, trying exchange adapter', {
        component: 'enhancedOrdersService',
        method: 'cancelOrder',
        data: { error: apiError },
      });

      // Try to use the exchange adapter if available
      try {
        if (exchangeId && symbol) {
          const adapter = ExchangeFactory.getAdapter(exchangeId);

          logger.debug('Canceling order with adapter', {
            component: 'enhancedOrdersService',
            method: 'cancelOrder',
            data: { exchangeId, orderId, symbol },
          });

          // Use 'default' as the API key ID for now
          const result = await adapter.cancelOrder('default', orderId, symbol);

          logger.debug('Order canceled with adapter', {
            component: 'enhancedOrdersService',
            method: 'cancelOrder',
            data: { result },
          });

          return result;
        }
      } catch (adapterError) {
        logger.error('Error canceling order with adapter', {
          component: 'enhancedOrdersService',
          method: 'cancelOrder',
          data: { error: adapterError },
        });
      }

      // Fall back to mock orders from localStorage
      logger.info('Falling back to mock orders for cancellation', {
        component: 'enhancedOrdersService',
        method: 'cancelOrder',
      });

      // Get the latest mock orders
      const currentMockOrders = getMockOrders();

      // Find the order in the current mock orders
      const index = currentMockOrders.findIndex(
        (order) => order.id === orderId,
      );

      if (index !== -1) {
        // Update the order
        currentMockOrders[index] = {
          ...currentMockOrders[index],
          status: 'canceled',
          updatedAt: new Date(),
        };

        // Save the updated orders back to localStorage
        saveMockOrders(currentMockOrders);

        logger.debug('Order canceled in mock orders', {
          component: 'enhancedOrdersService',
          method: 'cancelOrder',
          data: { order: currentMockOrders[index] },
        });

        return true;
      }

      return false;
    }
  } catch (error) {
    logger.error('Error canceling order', {
      component: 'enhancedOrdersService',
      method: 'cancelOrder',
      data: { error },
    });
    throw error;
  }
};
