import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
// This is a workaround for the supertest import issue
const request = require('supertest');
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) - should return 404 since root route is not defined', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .expect(404);
    
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Cannot GET /');
  });
});
