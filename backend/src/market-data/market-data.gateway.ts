import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MarketDataService } from './market-data.service';

@WebSocketGateway({ path: '/ws/v1/market-data', cors: { origin: '*' } }) // Set path and allow CORS
export class MarketDataGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('MarketDataGateway');

  constructor(private readonly marketDataService: MarketDataService) {
    // Log that the service is available
    this.logger.debug(
      `MarketDataService initialized: ${!!this.marketDataService}`,
    );
  }

  afterInit() {
    this.logger.log('WebSocket Gateway Initialized');
    // TODO: Start data fetching/streaming logic from service here?
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // TODO: Handle new connection, maybe send initial data?
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // TODO: Clean up subscriptions associated with this client
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { type: string; symbol: string }, // e.g., { type: 'ticker', symbol: 'BTC/USD' }
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(
      `Client ${client.id} subscribing to ${data.type} for ${data.symbol}`,
    );
    // TODO: Implement subscription logic (e.g., join room)
    void client.join(`${data.type}_${data.symbol}`); // Example room naming
    // Potentially send current state upon subscription
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { type: string; symbol: string },
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(
      `Client ${client.id} unsubscribing from ${data.type} for ${data.symbol}`,
    );
    // TODO: Implement unsubscription logic (e.g., leave room)
    void client.leave(`${data.type}_${data.symbol}`);
  }

  // Example method to broadcast data (will be called by the service later)
  broadcastTicker(symbol: string, tickerData: any) {
    this.server.to(`ticker_${symbol}`).emit('ticker', tickerData);
  }

  broadcastOrderbookUpdate(symbol: string, orderbookUpdate: any) {
    this.server
      .to(`orderbook_${symbol}`)
      .emit('orderbookUpdate', orderbookUpdate);
  }

  broadcastTrade(symbol: string, tradeData: any) {
    this.server.to(`trade_${symbol}`).emit('trade', tradeData);
  }
}
