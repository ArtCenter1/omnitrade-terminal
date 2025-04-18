import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

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

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  // Mock orders for different users
  private readonly mockOrders: Record<string, Order[]> = {};

  constructor(private prisma: PrismaService) {}

  /**
   * Place a new order
   */
  async placeOrder(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    this.logger.log(
      `Placing order for user ${userId}: ${JSON.stringify(createOrderDto)}`,
    );

    // Validate the order
    this.validateOrder(createOrderDto);

    // Create a new order
    const newOrder: Order = {
      id: uuidv4(),
      userId,
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

    // Add the order to the mock orders
    if (!this.mockOrders[userId]) {
      this.mockOrders[userId] = [];
    }
    this.mockOrders[userId].push(newOrder);

    // In a real implementation, we would send the order to the exchange
    // For now, we'll just simulate a successful order placement

    // For market orders, simulate immediate fill
    if (newOrder.type === 'market') {
      setTimeout(() => {
        this.simulateFill(newOrder.id, userId);
      }, 1000);
    }

    return newOrder;
  }

  /**
   * Get all orders for a user
   */
  async getOrders(
    userId: string,
    exchangeId?: string,
    symbol?: string,
    status?: string,
  ): Promise<Order[]> {
    this.logger.log(`Getting orders for user ${userId}`);

    // Get the user's orders
    const userOrders = this.mockOrders[userId] || [];

    // Filter by exchange, symbol, and status if provided
    return userOrders.filter((order) => {
      let match = true;

      if (exchangeId && order.exchangeId !== exchangeId) {
        match = false;
      }

      if (symbol && order.symbol !== symbol) {
        match = false;
      }

      if (status && order.status !== status) {
        match = false;
      }

      return match;
    });
  }

  /**
   * Get a specific order by ID
   */
  async getOrder(userId: string, orderId: string): Promise<Order> {
    this.logger.log(`Getting order ${orderId} for user ${userId}`);

    // Get the user's orders
    const userOrders = this.mockOrders[userId] || [];

    // Find the order
    const order = userOrders.find((o) => o.id === orderId);

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(userId: string, orderId: string): Promise<Order> {
    this.logger.log(`Canceling order ${orderId} for user ${userId}`);

    // Get the user's orders
    const userOrders = this.mockOrders[userId] || [];

    // Find the order
    const orderIndex = userOrders.findIndex((o) => o.id === orderId);

    if (orderIndex === -1) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const order = userOrders[orderIndex];

    // Check if the order can be canceled
    if (
      order.status === 'filled' ||
      order.status === 'canceled' ||
      order.status === 'rejected'
    ) {
      throw new Error(
        `Order ${orderId} cannot be canceled (status: ${order.status})`,
      );
    }

    // Update the order status
    order.status = 'canceled';
    order.updatedAt = new Date();

    // Update the order in the mock orders
    userOrders[orderIndex] = order;

    return order;
  }

  /**
   * Validate an order
   */
  private validateOrder(createOrderDto: CreateOrderDto): void {
    // Check required fields
    if (!createOrderDto.exchangeId) {
      throw new Error('Exchange ID is required');
    }

    if (!createOrderDto.symbol) {
      throw new Error('Symbol is required');
    }

    if (!createOrderDto.side) {
      throw new Error('Side is required');
    }

    if (!createOrderDto.type) {
      throw new Error('Type is required');
    }

    if (!createOrderDto.quantity || createOrderDto.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Check type-specific fields
    if (createOrderDto.type === 'limit' && !createOrderDto.price) {
      throw new Error('Price is required for limit orders');
    }

    if (createOrderDto.type === 'stop' && !createOrderDto.stopPrice) {
      throw new Error('Stop price is required for stop orders');
    }

    if (
      createOrderDto.type === 'stop_limit' &&
      (!createOrderDto.price || !createOrderDto.stopPrice)
    ) {
      throw new Error(
        'Price and stop price are required for stop-limit orders',
      );
    }
  }

  /**
   * Simulate filling an order (for mock data)
   */
  private simulateFill(orderId: string, userId: string): void {
    // Get the user's orders
    const userOrders = this.mockOrders[userId] || [];

    // Find the order
    const orderIndex = userOrders.findIndex((o) => o.id === orderId);

    if (orderIndex === -1) {
      return;
    }

    const order = userOrders[orderIndex];

    // Check if the order can be filled
    if (order.status !== 'new' && order.status !== 'partially_filled') {
      return;
    }

    // Simulate a fill
    const fillQuantity = order.quantity - order.filledQuantity;
    const fillPrice = order.price || this.getMarketPrice(order.symbol);

    // Update the order
    order.filledQuantity = order.quantity;
    order.avgFillPrice = fillPrice;
    order.status = 'filled';
    order.updatedAt = new Date();

    // Update the order in the mock orders
    userOrders[orderIndex] = order;

    this.logger.log(
      `Simulated fill for order ${orderId}: ${fillQuantity} @ ${fillPrice}`,
    );
  }

  /**
   * Get a mock market price for a symbol
   */
  private getMarketPrice(symbol: string): number {
    // Generate a realistic price based on the symbol
    if (symbol.includes('BTC')) {
      return 85000 + (Math.random() * 1000 - 500);
    } else if (symbol.includes('ETH')) {
      return 3000 + (Math.random() * 100 - 50);
    } else if (symbol.includes('SOL')) {
      return 150 + (Math.random() * 10 - 5);
    } else if (symbol.includes('BNB')) {
      return 600 + (Math.random() * 20 - 10);
    } else if (symbol.includes('XRP')) {
      return 0.5 + (Math.random() * 0.05 - 0.025);
    } else {
      return 100 + (Math.random() * 10 - 5);
    }
  }
}
