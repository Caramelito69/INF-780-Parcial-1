import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { QueryBookDto } from './dto/query-book.dto';

describe('BooksController', () => {
  let controller: BooksController;
  let service: BooksService;

  const mockBook = {
    id: 1,
    titulo: 'Código Limpio',
    autor: 'Robert C. Martin',
    isbn: '9780132350884',
    anioPublicacion: 2008,
    categoria: 'tecnico',
    stock: 5,
    creadoEn: new Date(),
    actualizadoEn: new Date()
  };

  const mockBooksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: mockBooksService,
        },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
    service = module.get<BooksService>(BooksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debería crear un libro', async () => {
      const createBookDto: CreateBookDto = {
        titulo: 'Código Limpio',
        autor: 'Robert C. Martin',
        isbn: '9780132350884',
        anioPublicacion: 2008,
        categoria: 'tecnico',
        stock: 5,
      };

      mockBooksService.create.mockResolvedValue(mockBook);

      const result = await controller.create(createBookDto);
      
      expect(result).toEqual(mockBook);
      expect(service.create).toHaveBeenCalledWith(createBookDto);
    });
  });

  describe('findAll', () => {
    it('debería retornar una lista de libros', async () => {
      const query: QueryBookDto = { page: 1, limit: 10 };
      const expectedResult = {
        data: [mockBook],
        count: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockBooksService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);
      
      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('debería retornar un libro por ID', async () => {
      const bookId = 1;
      mockBooksService.findOne.mockResolvedValue(mockBook);

      const result = await controller.findOne(bookId);
      
      expect(result).toEqual(mockBook);
      expect(service.findOne).toHaveBeenCalledWith(bookId);
    });

    it('debería lanzar error si el ID no es un número', async () => {
      
    });
  });

  describe('update', () => {
    it('debería actualizar un libro', async () => {
      const bookId = 1;
      const updateBookDto: UpdateBookDto = { stock: 10 };
      const updatedBook = { ...mockBook, ...updateBookDto };

      mockBooksService.update.mockResolvedValue(updatedBook);

      const result = await controller.update(bookId, updateBookDto);
      
      expect(result).toEqual(updatedBook);
      expect(service.update).toHaveBeenCalledWith(bookId, updateBookDto);
    });
  });

  describe('remove', () => {
    it('debería eliminar un libro', async () => {
      const bookId = 1;
      mockBooksService.remove.mockResolvedValue(undefined);

      await controller.remove(bookId);
      
      expect(service.remove).toHaveBeenCalledWith(bookId);
    });
  });
});
