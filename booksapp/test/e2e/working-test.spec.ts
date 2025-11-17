import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BooksModule } from '../../src/books/books.module';
import { Book } from '../../src/books/entities/book.entity';

describe('Working Test (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
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

  afterAll(async () => {
    await app.close();
  });

  it('should work', async () => {
    // This is a simple test to verify that the setup is working
    expect(true).toBe(true);
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

    // Use the request function directly
    const response = await (request as any)(app.getHttpServer())
      .post('/books')
      .send(createBookDto);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.titulo).toBe(createBookDto.titulo);
  });
});
