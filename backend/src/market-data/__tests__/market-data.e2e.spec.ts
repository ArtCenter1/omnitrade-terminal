import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import Redis from 'ioredis';
import { MarketDataModule } from '../market-data.module';
import { RateLimitMiddleware } from '../rate-limit.middleware';
import { MarketDataService } from '../market-data.service';

jest.mock('ioredis');

describe('Market Data API (e2e)', () => {
  let app: INestApplication;
  let redisMock: any;
  let server: any;
  let ioServer: Server;
  let clientSocket: ClientSocket;

  beforeAll(async () => {
    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
    };
    (Redis as any).mockImplementation(() => redisMock);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MarketDataModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.use(new RateLimitMiddleware().use.bind(new RateLimitMiddleware()));

    await app.init();

    // Setup raw HTTP + socket.io server for WebSocket tests
    server = createServer(app.getHttpAdapter().getInstance());
    ioServer = new Server(server, { path: '/ws/v1/market-data', cors: { origin: '*' } });
    server.listen(0); // random available port
    const port = (server.address() as any).port;

    clientSocket = Client(`http://localhost:${port}`, { path: '/ws/v1/market-data', transports: ['websocket'] });
  });

  afterAll(async () => {
    clientSocket.close();
    ioServer.close();
    server.close();
    await app.close();
  });

  describe('REST API', () => {
    beforeEach(() => {
      redisMock.get.mockReset();
      redisMock.set.mockReset();
    });

    it('/symbols - should return symbols from cache', async () => {
      redisMock.get.mockResolvedValue(JSON.stringify(['BTC/USD', 'ETH/USD']));
      const res = await request(app.getHttpServer()).get('/api/v1/market-data/symbols');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(['BTC/USD', 'ETH/USD']);
    });

    it('/ticker - validation error on missing symbol', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/market-data/ticker');
      expect(res.status).toBe(400);
    });

    it('/ticker - success with cache miss triggers fetch', async () => {
      redisMock.get.mockResolvedValue(null);
      redisMock.set.mockResolvedValue('OK');
      jest.spyOn(MarketDataService.prototype, 'getTicker').mockResolvedValue({ price: '100' });
      const res = await request(app.getHttpServer()).get('/api/v1/market-data/ticker?symbol=BTC/USD');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ price: '100' });
    });

    it('/orderbook - invalid limit param', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/market-data/orderbook?symbol=BTC/USD&limit=abc');
      expect(res.status).toBe(400);
    });

    it('/trades - success', async () => {
      redisMock.get.mockResolvedValue(JSON.stringify([{ id: 1 }]));
      const res = await request(app.getHttpServer()).get('/api/v1/market-data/trades?symbol=BTC/USD');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1 }]);
    });

    it('/klines - missing required interval param', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/market-data/klines?symbol=BTC/USD');
      expect(res.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      redisMock.incr.mockReset();
      redisMock.expire.mockReset();
    });

    it('should allow requests under limit for anonymous', async () => {
      redisMock.incr.mockResolvedValue(1);
      redisMock.expire.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get('/api/v1/market-data/symbols');
      expect(res.status).toBe(200);
    });

    it('should block requests over limit for anonymous', async () => {
      redisMock.incr.mockResolvedValue(11);
      const res = await request(app.getHttpServer()).get('/api/v1/market-data/symbols');
      expect(res.status).toBe(429);
    });

    it('should allow requests under limit for API key user', async () => {
      redisMock.incr.mockResolvedValue(50);
      redisMock.expire.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get('/api/v1/market-data/symbols').set('x-api-key', 'my-key');
      expect(res.status).toBe(200);
    });

    it('should block requests over limit for API key user', async () => {
      redisMock.incr.mockResolvedValue(101);
      const res = await request(app.getHttpServer()).get('/api/v1/market-data/symbols').set('x-api-key', 'my-key');
      expect(res.status).toBe(429);
    });
  });

  describe('WebSocket', () => {
    it('should subscribe and receive ticker updates', (done) => {
      clientSocket.emit('subscribe', { type: 'ticker', symbol: 'BTC/USD' });

      clientSocket.on('ticker', (data) => {
        expect(data).toEqual({ price: '100' });
        done();
      });

      setTimeout(() => {
        ioServer.to('ticker_BTC/USD').emit('ticker', { price: '100' });
      }, 100);
    });

    it('should unsubscribe successfully', (done) => {
      clientSocket.emit('subscribe', { type: 'ticker', symbol: 'BTC/USD' });
      clientSocket.emit('unsubscribe', { type: 'ticker', symbol: 'BTC/USD' });

      // Emit after unsubscribe, client should not receive
      clientSocket.on('ticker', () => {
        done.fail('Should not receive after unsubscribe');
      });

      setTimeout(() => {
        ioServer.to('ticker_BTC/USD').emit('ticker', { price: '200' });
        setTimeout(() => done(), 200);
      }, 100);
    });
  });
});