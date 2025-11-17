import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BooksModule } from '../../src/books/books.module';
import { Book } from '../../src/books/entities/book.entity';

// This is a workaround for the supertest import issue
const supertest = require('supertest');

describe('Fix Test (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Book],
          synchronize: true,
          dropSchema: true,
        }),
        BooksModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
    
    // Get the HTTP server instance
    httpServer = app.getHttpServer();
  });

  afterEach(async () => {
    // Clean up the database after each test
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a book', async () => {
    const createBookDto = {
      titulo: 'Test Book',
      autor: 'Test Author',
      isbn: '1234567890',
      anioPublicacion: 2023,
      categoria: 'ficcion',
      stock: 10,
    };

    // Use the workaround for supertest
    const response = await supertest(httpServer)
      .post('/books')
      .send(createBookDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.titulo).toBe(createBookDto.titulo);
    expect(response.body.autor).toBe(createBookDto.autor);
  });

  it('should get an empty array when no books exist', async () => {
    const response = await supertest(httpServer)
      .get('/books')
      .expect(200);

    // Check if the response has a 'data' property (for paginated responses)
    // or if it's directly an array
    if (response.body.data !== undefined) {
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    } else {
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    }
  });
});
