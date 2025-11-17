import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BooksModule } from '../../src/books/books.module';
import { Book } from '../../src/books/entities/book.entity';

// Create a custom request function that works with supertest
type RequestMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

function createRequest(app: INestApplication) {
  return {
    get: (url: string) => request(app.getHttpServer()).get(url),
    post: (url: string) => request(app.getHttpServer()).post(url),
    patch: (url: string) => request(app.getHttpServer()).patch(url),
    delete: (url: string) => request(app.getHttpServer()).delete(url),
  };
}

describe('Simple Books Test (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let httpRequest: ReturnType<typeof createRequest>;

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
    
    // Initialize the custom request helper
    httpRequest = createRequest(app);
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

    const response = await httpRequest
      .post('/books')
      .send(createBookDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.titulo).toBe(createBookDto.titulo);
    expect(response.body.autor).toBe(createBookDto.autor);
  });

  it('should get an empty array when no books exist', async () => {
    const response = await httpRequest
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

  it('should get a book by ID', async () => {
    // First, create a book
    const createResponse = await httpRequest
      .post('/books')
      .send({
        titulo: 'Test Book',
        autor: 'Test Author',
        isbn: '1234567890',
        anioPublicacion: 2023,
        categoria: 'ficcion',
        stock: 10,
      })
      .expect(201);

    const bookId = createResponse.body.id;

    // Then, get the book by ID
    const getResponse = await httpRequest
      .get(`/books/${bookId}`)
      .expect(200);

    expect(getResponse.body).toBeDefined();
    expect(getResponse.body.id).toBe(bookId);
    expect(getResponse.body.titulo).toBe('Test Book');
  });
});
