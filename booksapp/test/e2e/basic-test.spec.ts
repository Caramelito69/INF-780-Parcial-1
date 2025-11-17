import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BooksModule } from '../../src/books/books.module';
import { Book } from '../../src/books/entities/book.entity';

describe('Basic Books Test (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

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

    const response = await request(app.getHttpServer())
      .post('/books')
      .send(createBookDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.titulo).toBe(createBookDto.titulo);
    expect(response.body.autor).toBe(createBookDto.autor);
  });

  it('should get an empty array when no books exist', async () => {
    const response = await request(app.getHttpServer())
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
