import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { orderPlacementLimiter } from './../src/middleware/rate-limiter.middleware';
import * as admin from 'firebase-admin';

describe('Orders Security (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();

    // Mimic main.ts setup
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.use('/api/orders', orderPlacementLimiter);

    // Mock Firebase verification
    jest.spyOn(admin.auth(), 'verifyIdToken').mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com',
    } as any);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const endpoint = '/api/orders';
  const validToken = 'Bearer mock-token';

  describe('Rate Limiting', () => {
    it('blocks the 21st request from the same IP with 429', async () => {
      const ip = '10.0.0.10';
      for (let i = 0; i < 20; i++) {
        await request(app.getHttpServer())
          .post(endpoint)
          .set('Authorization', validToken)
          .set('X-Forwarded-For', ip);
      }

      const res = await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', validToken)
        .set('X-Forwarded-For', ip);

      expect(res.status).toBe(429);
      const message = typeof res.body === 'string' ? res.body : (res.body.message || res.text);
      expect(message).toContain('Too many order placement requests');
    });
  });

  describe('Input Validation (DTO)', () => {
    it('returns 400 when required fields are missing', async () => {
      const res = await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', validToken)
        .send({ exchangeId: 'binance' }); // Missing symbol, side, type, quantity

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid side', async () => {
      const res = await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', validToken)
        .send({
          exchangeId: 'binance',
          symbol: 'BTC/USDT',
          side: 'invalid-side',
          type: 'market',
          quantity: 1,
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('side must be either');
    });

    it('returns 400 when price is missing for limit order', async () => {
      const res = await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', validToken)
        .send({
          exchangeId: 'binance',
          symbol: 'BTC/USDT',
          side: 'buy',
          type: 'limit',
          quantity: 1,
          // price is missing
        });

      expect(res.status).toBe(400);
    });

    it('returns 400 for non-positive quantity', async () => {
      const res = await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', validToken)
        .send({
          exchangeId: 'binance',
          symbol: 'BTC/USDT',
          side: 'buy',
          type: 'market',
          quantity: -1,
        });

      expect(res.status).toBe(400);
    });
  });
});
