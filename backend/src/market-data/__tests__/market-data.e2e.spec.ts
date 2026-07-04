import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import Redis from 'ioredis';
import { MarketDataModule } from '../market-data.module';
import { RateLimitMiddleware } from '../rate-limit.middleware';
import { MarketDataService } from '../market-data.service';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

jest.mock('ioredis');

describe('Market Data API (e2e)', () => {
  let app: INestApplication;
  let redisMock: {
    get: jest.Mock;
    set: jest.Mock;
    incr: jest.Mock;
    expire: jest.Mock;
  };
  let server: import('http').Server;
  let ioServer: Server;
  let clientSocket: ClientSocket;

  beforeAll(async () => {
    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
    };
    (
      Redis as unknown as {
        mockImplementation: (impl: () => typeof redisMock) => void;
      }
    ).mockImplementation(() => redisMock);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MarketDataModule,
      ],
    })
      .overrideProvider(RedisService)
      .useValue(redisMock)
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.use(new RateLimitMiddleware(redisMock as any).use.bind(new RateLimitMiddleware(redisMock as any)));

    await app.init();

    // Setup raw HTTP + socket.io server for WebSocket tests
    server = createServer(app.getHttpAdapter().getInstance());
    ioServer = new Server(server, {
      path: '/ws/v1/market-data',
      cors: { origin: '*' },
    });
    server.listen(0); // random available port
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    clientSocket = Client(`http://localhost:${port}`, {
      path: '/ws/v1/market-data',
      transports: ['websocket'],
    });
  });

  afterAll(async () => {
    if (clientSocket) clientSocket.close();
    if (ioServer) ioServer.close();
    if (server) server.close();
    if (app) await app.close();
  });

  describe('REST API', () => {
    beforeEach(() => {
      redisMock.get.mockReset();
      redisMock.set.mockReset();
    });

    it('/markets - should return markets from cache', async () => {
      const mockMarkets = [{ id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 50000 }];
      redisMock.get.mockImplementation((key: string) => {
        if (key.includes('markets')) return Promise.resolve(JSON.stringify(mockMarkets));
        return Promise.resolve(null);
      });
      const res = await request(app.getHttpServer()).get(
        '/api/v1/market-data/markets',
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockMarkets);
    });

    it('/markets - success with cache miss triggers fetch', async () => {
      const mockMarkets = [{ id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 50000 }] as any;
      redisMock.get.mockResolvedValue(null);
      redisMock.set.mockResolvedValue('OK');
      jest.spyOn(MarketDataService.prototype, 'getMarkets').mockResolvedValue(mockMarkets);
      const res = await request(app.getHttpServer()).get(
        '/api/v1/market-data/markets',
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockMarkets);
    });

    it('/orderbook - invalid limit param', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/market-data/orderbook?symbol=BTC/USD&limit=abc',
      );
      expect(res.status).toBe(400);
    });

    it('/trades - success', async () => {
      redisMock.get.mockResolvedValue(JSON.stringify([{ id: 1 }]));
      const res = await request(app.getHttpServer()).get(
        '/api/v1/market-data/trades?symbol=BTC/USD',
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1 }]);
    });

    it('/klines - missing required interval param', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/market-data/klines?symbol=BTC/USD',
      );
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
      const res = await request(app.getHttpServer()).get(
        '/api/v1/market-data/markets',
      );
      expect(res.status).toBe(200);
    });

    it('should block requests over limit for anonymous', async () => {
      redisMock.incr.mockResolvedValue(11);
      const res = await request(app.getHttpServer()).get(
        '/api/v1/market-data/markets',
      );
      expect(res.status).toBe(429);
    });

    it('should allow requests under limit for API key user', async () => {
      redisMock.incr.mockResolvedValue(50);
      redisMock.expire.mockResolvedValue(1);
      const res = await request(app.getHttpServer())
        .get('/api/v1/market-data/markets')
        .set('x-api-key', 'my-key');
      expect(res.status).toBe(200);
    });

    it('should block requests over limit for API key user', async () => {
      redisMock.incr.mockResolvedValue(101);
      const res = await request(app.getHttpServer())
        .get('/api/v1/market-data/markets')
        .set('x-api-key', 'my-key');
      expect(res.status).toBe(429);
    });
  });

  describe('WebSocket', () => {
    it('should subscribe and receive ticker updates', (done) => {
      clientSocket.emit('subscribe', { type: 'ticker', symbol: 'BTC/USD' });

      clientSocket.on('ticker', (data: unknown) => {
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
