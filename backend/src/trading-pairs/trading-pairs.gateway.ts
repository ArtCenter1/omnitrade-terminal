import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TradingPairsService } from './trading-pairs.service';

interface SubscriptionData {
  exchangeId: string;
  symbol: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict this to your frontend domain
  },
  namespace: 'trading',
})
export class TradingPairsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(TradingPairsGateway.name);
  private readonly subscriptions = new Map<string, Set<string>>();
  private readonly mockPriceIntervals = new Map<string, NodeJS.Timeout>();

  constructor(private readonly tradingPairsService: TradingPairsService) {}

  afterInit() {
    this.logger.log('Trading WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.subscriptions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Clear all subscriptions for this client
    const clientSubscriptions = this.subscriptions.get(client.id);
    if (clientSubscriptions) {
      clientSubscriptions.forEach((key) => {
        // Check if any other clients are subscribed to this pair
        let hasOtherSubscribers = false;
        this.subscriptions.forEach((subs, clientId) => {
          if (clientId !== client.id && subs.has(key)) {
            hasOtherSubscribers = true;
          }
        });

        // If no other clients are subscribed, clear the interval
        if (!hasOtherSubscribers && this.mockPriceIntervals.has(key)) {
          clearInterval(this.mockPriceIntervals.get(key));
          this.mockPriceIntervals.delete(key);
        }
      });
    }

    this.subscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, data: SubscriptionData): void {
    const { exchangeId, symbol } = data;
    const key = `${exchangeId}:${symbol}`;

    this.logger.log(`Client ${client.id} subscribing to ${key}`);

    // Add to client's subscriptions
    const clientSubscriptions = this.subscriptions.get(client.id) || new Set();
    clientSubscriptions.add(key);
    this.subscriptions.set(client.id, clientSubscriptions);

    // Start sending mock price updates if not already doing so
    if (!this.mockPriceIntervals.has(key)) {
      this.startMockPriceUpdates(exchangeId, symbol);
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, data: SubscriptionData): void {
    const { exchangeId, symbol } = data;
    const key = `${exchangeId}:${symbol}`;

    this.logger.log(`Client ${client.id} unsubscribing from ${key}`);

    // Remove from client's subscriptions
    const clientSubscriptions = this.subscriptions.get(client.id);
    if (clientSubscriptions) {
      clientSubscriptions.delete(key);
    }

    // Check if any other clients are still subscribed
    let hasOtherSubscribers = false;
    this.subscriptions.forEach((subs, clientId) => {
      if (clientId !== client.id && subs.has(key)) {
        hasOtherSubscribers = true;
      }
    });

    // If no other clients are subscribed, clear the interval
    if (!hasOtherSubscribers && this.mockPriceIntervals.has(key)) {
      clearInterval(this.mockPriceIntervals.get(key));
      this.mockPriceIntervals.delete(key);
    }
  }

  private startMockPriceUpdates(exchangeId: string, symbol: string): void {
    const key = `${exchangeId}:${symbol}`;

    // Get the trading pair to use as a base for mock data
    this.tradingPairsService
      .getTradingPair(exchangeId, symbol)
      .then((pair) => {
        if (!pair) {
          this.logger.warn(`Trading pair not found: ${key}`);
          return;
        }

        // Generate a realistic starting price based on the asset
        let basePrice = 0;
        if (pair.baseAsset === 'BTC') basePrice = 85000;
        else if (pair.baseAsset === 'ETH') basePrice = 3000;
        else if (pair.baseAsset === 'SOL') basePrice = 150;
        else if (pair.baseAsset === 'BNB') basePrice = 600;
        else if (pair.baseAsset === 'XRP') basePrice = 0.5;
        else basePrice = 100; // Default

        // Add some randomness to the starting price
        const startPrice = basePrice * (0.95 + Math.random() * 0.1);

        // Set up interval to send mock price updates
        const interval = setInterval(() => {
          // Generate a new price with small random change
          const priceChange = startPrice * (Math.random() * 0.01 - 0.005);
          const newPrice = startPrice + priceChange;

          // Generate mock volume
          const volume = Math.random() * 100;

          // Send the update to all subscribed clients
          this.server.emit(`price:${key}`, {
            exchangeId,
            symbol,
            price: newPrice.toFixed(pair.priceDecimals),
            volume: volume.toFixed(2),
            timestamp: Date.now(),
          });
        }, 2000); // Update every 2 seconds

        this.mockPriceIntervals.set(key, interval);
      })
      .catch((error) => {
        this.logger.error(
          `Error starting mock price updates for ${key}:`,
          error,
        );
      });
  }
}
