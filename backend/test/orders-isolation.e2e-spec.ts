import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import * as admin from 'firebase-admin';

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  const verifyIdTokenMock = jest.fn();
  return {
    auth: jest.fn(() => ({
      verifyIdToken: verifyIdTokenMock,
    })),
    credential: {
      cert: jest.fn(),
    },
    initializeApp: jest.fn(),
    apps: [],
  };
});

describe('Orders Isolation (e2e)', () => {
  let app: INestApplication;
  const mockVerifyIdToken = admin.auth().verifyIdToken as jest.Mock;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should not allow User A to access User B\'s orders', async () => {
    const userA = { uid: 'user-a', email: 'user-a@example.com' };
    const userB = { uid: 'user-b', email: 'user-b@example.com' };

    // 1. User A places an order
    mockVerifyIdToken.mockResolvedValue(userA);
    const orderResponse = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', 'Bearer token-a')
      .send({
        exchangeId: 'binance',
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'market',
        quantity: 0.1,
      })
      .expect(201);

    const orderId = orderResponse.body.id;

    // 2. User B tries to fetch User A's order
    mockVerifyIdToken.mockResolvedValue(userB);
    await request(app.getHttpServer())
      .get(`/api/orders/${orderId}`)
      .set('Authorization', 'Bearer token-b')
      .expect(404);

    // 3. User B tries to fetch all orders and should not see User A's order
    mockVerifyIdToken.mockResolvedValue(userB);
    const listResponse = await request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', 'Bearer token-b')
      .expect(200);

    const userBOrders = listResponse.body;
    expect(userBOrders.find((o: any) => o.id === orderId)).toBeUndefined();

    // 4. User A can still fetch their own order
    mockVerifyIdToken.mockResolvedValue(userA);
    await request(app.getHttpServer())
      .get(`/api/orders/${orderId}`)
      .set('Authorization', 'Bearer token-a')
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(orderId);
        expect(res.body.userId).toBe('user-a');
      });
  });
});
