import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
const request = (app: any) => supertest.agent(app);
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BooksModule } from '../../src/books/books.module';
import { Book } from '../../src/books/entities/book.entity';

describe('BooksController (e2e)', () => {
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
    // Limpiar la base de datos después de cada prueba
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('debería crear y obtener un libro', async () => {
    // 1. Crear un libro
    const createResponse = await request(app.getHttpServer())
      .post('/books')
      .send({
        titulo: 'Código Limpio',
        autor: 'Robert C. Martin',
        isbn: '9780132350884',
        anioPublicacion: 2008,
        categoria: 'tecnico',
        stock: 5,
      })
      .expect(201);

    const bookId = createResponse.body.id;
    
    // 2. Obtener el libro recién creado
    const getResponse = await request(app.getHttpServer())
      .get(`/books/${bookId}`)
      .expect(200);

    // 3. Verificar que los datos coincidan
    expect(getResponse.body).toBeDefined();
    expect(getResponse.body.id).toBe(bookId);
    expect(getResponse.body.titulo).toBe('Código Limpio');
    expect(getResponse.body.autor).toBe('Robert C. Martin');
  });

  it('debería devolver un array vacío cuando no hay libros', async () => {
    const response = await request(app.getHttpServer())
      .get('/books')
      .expect(200);

    // Verificar que la respuesta tenga la estructura esperada
    if (response.body.data) {
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    } else {
      // Si no tiene la propiedad data, debería ser un array vacío
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    }
  });
});
