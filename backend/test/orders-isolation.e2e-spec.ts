import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import * as admin from 'firebase-admin';

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  const verifyIdTokenMock = jest.fn();
  return {
    auth: () => ({
      verifyIdToken: verifyIdTokenMock,
    }),
    credential: {
      cert: jest.fn(),
    },
    initializeApp: jest.fn(),
    apps: [],
  };
});

describe('Orders Isolation (e2e)', () => {
  let app: INestApplication;
  const adminAuth = admin.auth();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should isolate orders between users', async () => {
    const user1Token = 'token-user-1';
    const user2Token = 'token-user-2';

    // Mock verification for user 1
    (adminAuth.verifyIdToken as jest.Mock).mockImplementation((token) => {
      if (token === user1Token) return Promise.resolve({ uid: 'user-1' });
      if (token === user2Token) return Promise.resolve({ uid: 'user-2' });
      return Promise.reject(new Error('Invalid token'));
    });

    // 1. User 1 places an order
    const orderData = {
      exchangeId: 'binance',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'market',
      quantity: 0.1,
    };

    const user1OrderResponse = await request(app.getHttpServer() as unknown as import('http').Server)
      .post('/api/orders')
      .set('Authorization', `Bearer ${user1Token}`)
      .send(orderData)
      .expect(201);

    const orderId = user1OrderResponse.body.id;

    // 2. User 2 tries to get User 1's order
    await request(app.getHttpServer() as unknown as import('http').Server)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(404); // Should be not found for User 2

    // 3. User 1 can get their own order
    await request(app.getHttpServer() as unknown as import('http').Server)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(orderId);
        expect(res.body.userId).toBe('user-1');
      });

    // 4. User 2 list orders, should be empty
    await request(app.getHttpServer() as unknown as import('http').Server)
      .get('/api/orders')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(0);
      });

    // 5. User 2 places their own order
    await request(app.getHttpServer() as unknown as import('http').Server)
      .post('/api/orders')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ ...orderData, quantity: 0.2 })
      .expect(201);

    // 6. User 2 list orders, should have 1 order
    await request(app.getHttpServer() as unknown as import('http').Server)
      .get('/api/orders')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBe(1);
        expect(res.body[0].userId).toBe('user-2');
      });
  });
});
