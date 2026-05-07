import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import * as admin from 'firebase-admin';

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  return {
    auth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn(),
    }),
    credential: {
      cert: jest.fn(),
    },
    initializeApp: jest.fn(),
    apps: [{}], // Pretend an app already exists
  };
});

describe('Orders Isolation (reproduction e2e)', () => {
  let app: INestApplication;
  let mockVerifyIdToken: jest.Mock;

  beforeAll(async () => {
    process.env.VITE_AUTH_PROVIDER = 'firebase';
    mockVerifyIdToken = admin.auth().verifyIdToken as jest.Mock;

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

  it('should isolate orders between users', async () => {
    const userAId = 'user-a-id';
    const userBId = 'user-b-id';

    // 1. Place order as User A
    mockVerifyIdToken.mockResolvedValue({ uid: userAId });
    const orderData = {
      exchangeId: 'binance',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'limit',
      price: 50000,
      quantity: 0.1,
    };

    const placeRes = await request(app.getHttpServer() as unknown as import('http').Server)
      .post('/api/orders')
      .set('Authorization', 'Bearer token-a')
      .send(orderData)
      .expect(201);

    const orderId = placeRes.body.id;

    // 2. Try to get User A's order as User B
    mockVerifyIdToken.mockResolvedValue({ uid: userBId });
    const getRes = await request(app.getHttpServer() as unknown as import('http').Server)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', 'Bearer token-b');

    // Now it should be 404 because User B cannot see User A's order
    expect(getRes.status).toBe(404);

    // 3. User B gets their own (empty) orders list
    mockVerifyIdToken.mockResolvedValue({ uid: userBId });
    const listRes = await request(app.getHttpServer() as unknown as import('http').Server)
      .get('/api/orders')
      .set('Authorization', 'Bearer token-b')
      .expect(200);

    expect(listRes.body).toHaveLength(0);

    // 4. User A gets their orders list
    mockVerifyIdToken.mockResolvedValue({ uid: userAId });
    const listResA = await request(app.getHttpServer() as unknown as import('http').Server)
      .get('/api/orders')
      .set('Authorization', 'Bearer token-a')
      .expect(200);

    expect(listResA.body).toHaveLength(1);
    expect(listResA.body[0].id).toBe(orderId);
  });
});
