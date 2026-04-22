import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer() as unknown as import('http').Server)
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/auth/password-reset-request', () => {
    const endpoint = '/api/auth/password-reset-request';
    const testEmail = 'test@example.com';

    it('allows 3 requests from the same IP', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer() as unknown as import('http').Server)
          .post(endpoint)
          .set('X-Forwarded-For', '1.2.3.4')
          .send({ email: testEmail })
          .expect((res: any) => {
            // Accept 200, 201, 204 or 501 (currently not implemented)
            if (![200, 201, 204, 501].includes(res.status)) {
              throw new Error(`Unexpected status: ${res.status}`);
            }
          });
      }
    });

    it('blocks the 4th request from the same IP with 429', async () => {
      // Send 3 requests to reach the limit
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer() as unknown as import('http').Server)
          .post(endpoint)
          .set('X-Forwarded-For', '5.6.7.8')
          .send({ email: testEmail });
      }
      // 4th request should be rate limited
      await request(app.getHttpServer() as unknown as import('http').Server)
        .post(endpoint)
        .set('X-Forwarded-For', '5.6.7.8')
        .send({ email: testEmail })
        .expect(429);
    });
  });

  describe('/exchange-api-keys/:id/test', () => {
    const endpoint = '/api/exchange-api-keys/some-id/test';

    it('allows 10 requests from the same IP', async () => {
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer() as unknown as import('http').Server)
          .post(endpoint)
          .set('X-Forwarded-For', '1.1.1.1')
          .expect((res: any) => {
            // Should be 401 (Unauthorized) since no token is provided,
            // but NOT 429 (Too Many Requests)
            if (res.status === 429) {
              throw new Error('Rate limited too early');
            }
          });
      }
    });

    it('blocks the 11th request from the same IP with 429', async () => {
      // Send 10 requests to reach the limit
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer() as unknown as import('http').Server)
          .post(endpoint)
          .set('X-Forwarded-For', '2.2.2.2');
      }
      // 11th request should be rate limited
      await request(app.getHttpServer() as unknown as import('http').Server)
        .post(endpoint)
        .set('X-Forwarded-For', '2.2.2.2')
        .expect(429);
    });
  });
});
