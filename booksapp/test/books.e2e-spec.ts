import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BooksModule } from './../src/books/books.module';
import { Book } from './../src/books/entities/book.entity';

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

  describe('POST /books', () => {
    it('debería crear un libro exitosamente', async () => {
      const createBookDto = {
        titulo: 'Código Limpio',
        autor: 'Robert C. Martin',
        isbn: '9780132350884',
        anioPublicacion: 2008,
        categoria: 'tecnico',
        stock: 5,
      };

      const response = await request(app.getHttpServer())
        .post('/books')
        .send(createBookDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.titulo).toBe(createBookDto.titulo);
      expect(response.body.autor).toBe(createBookDto.autor);
      expect(response.body.isbn).toBe(createBookDto.isbn);
      expect(response.body.anioPublicacion).toBe(createBookDto.anioPublicacion);
      expect(response.body.categoria).toBe(createBookDto.categoria);
      expect(response.body.stock).toBe(createBookDto.stock);
    });

    it('debería fallar al crear un libro con datos inválidos', async () => {
      const invalidBook = {
        titulo: '', // Título vacío
        autor: '',   // Autor vacío
        isbn: '123', // ISBN inválido
        anioPublicacion: 1000, // Año inválido
        categoria: 'inexistente', // Categoría inválida
        stock: -5, // Stock negativo
      };

      const response = await request(app.getHttpServer())
        .post('/books')
        .send(invalidBook)
        .expect(400);

      expect(response.body.message).toBeDefined();
      expect(response.body.message).toContain('ISBN inválido');
    });
  });

  describe('GET /books', () => {
    it('debería devolver un array vacío cuando no hay libros', async () => {
      const response = await request(app.getHttpServer())
        .get('/books')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('debería devolver todos los libros', async () => {
      // Insertar libros de prueba directamente en la base de datos
      const bookRepository = dataSource.getRepository(Book);
      await bookRepository.save([
        {
          titulo: 'Código Limpio',
          autor: 'Robert C. Martin',
          isbn: '9780132350884',
          anioPublicacion: 2008,
          categoria: 'tecnico',
          stock: 5,
        },
        {
          titulo: 'Patrones de Diseño',
          autor: 'Erich Gamma',
          isbn: '9780201633610',
          anioPublicacion: 1994,
          categoria: 'tecnico',
          stock: 3,
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/books')
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      
      // Verificar que los títulos de los libros devueltos coincidan con los esperados
      const titulos = response.body.data.map((book: any) => book.titulo);
      expect(titulos).toContain('Código Limpio');
      expect(titulos).toContain('Patrones de Diseño');
    });
  });

  describe('GET /books/:id', () => {
    let testBook: Book;

    beforeEach(async () => {
      // Crear un libro de prueba
      const bookRepository = dataSource.getRepository(Book);
      testBook = await bookRepository.save({
        titulo: 'Código Limpio',
        autor: 'Robert C. Martin',
        isbn: '9780132350884',
        anioPublicacion: 2008,
        categoria: 'tecnico',
        stock: 5,
      });
    });

    it('debería devolver un libro por su ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/${testBook.id}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testBook.id);
      expect(response.body.titulo).toBe(testBook.titulo);
    });

    it('debería devolver 404 para un ID que no existe', async () => {
      const nonExistentId = 9999;
      await request(app.getHttpServer())
        .get(`/books/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('PATCH /books/:id', () => {
    let testBook: Book;

    beforeEach(async () => {
      // Crear un libro de prueba
      const bookRepository = dataSource.getRepository(Book);
      testBook = await bookRepository.save({
        titulo: 'Código Limpio',
        autor: 'Robert C. Martin',
        isbn: '9780132350884',
        anioPublicacion: 2008,
        categoria: 'tecnico',
        stock: 5,
      });
    });

    it('debería actualizar un libro existente', async () => {
      const updateData = {
        titulo: 'Código Limpio - Edición Especial',
        stock: 10,
      };

      const response = await request(app.getHttpServer())
        .patch(`/books/${testBook.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testBook.id);
      expect(response.body.titulo).toBe(updateData.titulo);
      expect(response.body.stock).toBe(updateData.stock);
      
      // Verificar que los demás campos no han cambiado
      expect(response.body.autor).toBe(testBook.autor);
      expect(response.body.isbn).toBe(testBook.isbn);
    });
  });

  describe('DELETE /books/:id', () => {
    let testBook: Book;

    beforeEach(async () => {
      // Crear un libro de prueba
      const bookRepository = dataSource.getRepository(Book);
      testBook = await bookRepository.save({
        titulo: 'Código Limpio',
        autor: 'Robert C. Martin',
        isbn: '9780132350884',
        anioPublicacion: 2008,
        categoria: 'tecnico',
        stock: 5,
      });
    });

    it('debería eliminar un libro existente', async () => {
      // Primero verificar que el libro existe
      await request(app.getHttpServer())
        .get(`/books/${testBook.id}`)
        .expect(200);

      // Eliminar el libro
      await request(app.getHttpServer())
        .delete(`/books/${testBook.id}`)
        .expect(200);

      // Verificar que el libro ya no existe
      await request(app.getHttpServer())
        .get(`/books/${testBook.id}`)
        .expect(404);
    });

    it('debería devolver 404 al intentar eliminar un libro que no existe', async () => {
      const nonExistentId = 9999;
      await request(app.getHttpServer())
        .delete(`/books/${nonExistentId}`)
        .expect(404);
    });
  });
});
