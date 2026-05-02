import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Proxy Authentication (e2e)', () => {
  let app: INestApplication;

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

  describe('CoinGecko Proxy', () => {
    it('should return 401 when accessing without token', async () => {
      await request(app.getHttpServer() as unknown as import('http').Server)
        .get('/api/proxy/coingecko/coins/list')
        .expect(401);
    });
  });

  describe('Binance Testnet Proxy', () => {
    it('should return 401 when accessing without token', async () => {
      await request(app.getHttpServer() as unknown as import('http').Server)
        .get('/api/proxy/binance-testnet/api/v3/ping')
        .expect(401);
    });
  });
});
