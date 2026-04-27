import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer() as unknown as import('http').Server)
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });
});

describe('/auth/password-reset-request rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.setGlobalPrefix('api');
    await app.init();
  });

  const endpoint = '/api/auth/password-reset-request';
  const testEmail = 'test@example.com';

  it('allows 3 requests from the same IP', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer() as unknown as import('http').Server)
        .post(endpoint)
        .set('X-Forwarded-For', '1.2.3.4')
        .send({ email: testEmail })
        .expect((res: any) => {
          // Accept 200, 201, 204 or 501 (Not Implemented) for this test
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
