import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('BooksService', () => {
  let service: BooksService;
  let booksRepository: Repository<Book>;

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

  const mockBooksRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockBook], 1]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: mockBooksRepository,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    booksRepository = module.get<Repository<Book>>(getRepositoryToken(Book));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería crear un libro exitosamente', async () => {
      const createBookDto: CreateBookDto = {
        titulo: 'Código Limpio',
        autor: 'Robert C. Martin',
        isbn: '9780132350884',
        anioPublicacion: 2008,
        categoria: 'tecnico',
        stock: 5
      };

      mockBooksRepository.create.mockReturnValue(mockBook);
      mockBooksRepository.save.mockResolvedValue(mockBook);

      const result = await service.create(createBookDto);
      expect(result).toEqual(mockBook);
      expect(mockBooksRepository.create).toHaveBeenCalledWith(createBookDto);
      expect(mockBooksRepository.save).toHaveBeenCalledWith(mockBook);
    });

    it('debería lanzar BadRequestException si el ISBN es inválido', async () => {
      const createBookDto: CreateBookDto = {
        titulo: 'Libro con ISBN inválido',
        autor: 'Autor',
        isbn: '123',
        stock: 1
      };

      await expect(service.create(createBookDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('debería retornar una lista paginada de libros', async () => {
      const query = { page: 1, limit: 10 };
      
      const result = await service.findAll(query);
      
      expect(result).toEqual({
        data: [mockBook],
        total: 1,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findOne', () => {
    it('debería retornar un libro por ID', async () => {
      mockBooksRepository.findOne.mockResolvedValue(mockBook);
      
      const result = await service.findOne(1);
      
      expect(result).toEqual(mockBook);
      expect(mockBooksRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('debería lanzar NotFoundException si el libro no existe', async () => {
      mockBooksRepository.findOne.mockResolvedValue(undefined);
      
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debería actualizar un libro exitosamente', async () => {
      const updateBookDto: UpdateBookDto = { stock: 10 };
      
      mockBooksRepository.findOne.mockResolvedValue(mockBook);
      mockBooksRepository.save.mockResolvedValue({ ...mockBook, ...updateBookDto });
      
      const result = await service.update(1, updateBookDto);
      
      expect(result).toEqual({ ...mockBook, ...updateBookDto });
      expect(mockBooksRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debería eliminar un libro exitosamente', async () => {
      mockBooksRepository.findOne.mockResolvedValue(mockBook);
      mockBooksRepository.delete.mockResolvedValue({ affected: 1 } as any);
      
      await service.remove(1);
      
      expect(mockBooksRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
