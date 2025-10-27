import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { QueryBookDto } from './dto/query-book.dto';
import { Book } from './entities/book.entity';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
  ) {}

  private norm(s: string) {
    return s.trim().toLowerCase();
  }

  private validaIsbn(isbn?: string) {
    if (!isbn) return;
    const clean = isbn.replace(/[-\s]/g, '');
    const is10 = /^\d{9}[\dXx]$/.test(clean);
    const is13 = /^\d{13}$/.test(clean);
    if (!is10 && !is13) {
      throw new BadRequestException('ISBN inválido: use ISBN-10 o ISBN-13.');
    }
  }

  private async validaUnicidad(
    titulo: string,
    autor: string,
    idEditar?: number,
  ) {
    const existing = await this.booksRepository
      .createQueryBuilder('book')
      .where('LOWER(book.titulo) = LOWER(:titulo)', { titulo })
      .andWhere('LOWER(book.autor) = LOWER(:autor)', { autor })
      .getOne();

    if (existing && existing.id !== idEditar) {
      throw new ConflictException(
        'Ya existe un libro con el mismo título y autor.',
      );
    }
  }

  private validaAnio(anio?: number) {
    if (anio == null) return;
    const yearNow = new Date().getFullYear();
    if (anio < 1450 || anio > yearNow) {
      throw new BadRequestException(
        `anioPublicacion debe estar entre 1450 y ${yearNow}.`,
      );
    }
  }

  private validaStock(stock?: number) {
    if (stock == null) return;
    if (stock < 0) {
      throw new BadRequestException('stock no puede ser negativo.');
    }
  }

  async create(dto: CreateBookDto): Promise<Book> {
    await this.validaUnicidad(dto.titulo, dto.autor);
    this.validaIsbn(dto.isbn);
    this.validaAnio(dto.anioPublicacion);
    this.validaStock(dto.stock);

    const newBook = this.booksRepository.create({
      titulo: dto.titulo,
      autor: dto.autor,
      isbn: dto.isbn,
      anioPublicacion: dto.anioPublicacion,
      categoria: dto.categoria,
      stock: dto.stock ?? 0,
    });

    return this.booksRepository.save(newBook);
  }

  async findAll(q: QueryBookDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const conStock = q.conStock === '1' || q.conStock === 'true';

    const qb = this.booksRepository.createQueryBuilder('book');

    if (q.q) {
      const term = `%${q.q.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(book.titulo) LIKE :term OR LOWER(book.autor) LIKE :term)',
        { term },
      );
    }

    if (q.categoria)
      qb.andWhere('book.categoria = :categoria', { categoria: q.categoria });
    if (q.anioDesde != null)
      qb.andWhere('book.anioPublicacion >= :anioDesde', {
        anioDesde: q.anioDesde,
      });
    if (q.anioHasta != null)
      qb.andWhere('book.anioPublicacion <= :anioHasta', {
        anioHasta: q.anioHasta,
      });
    if (conStock) qb.andWhere('book.stock > 0');

    qb.orderBy('book.creadoEn', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.booksRepository.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException('Libro no encontrado.');
    }
    return book;
  }

  async update(id: number, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);

    if (dto.titulo || dto.autor) {
      const t = dto.titulo ?? book.titulo;
      const a = dto.autor ?? book.autor;
      await this.validaUnicidad(t, a, id);
    }

    if (dto.isbn !== undefined) this.validaIsbn(dto.isbn);
    if (dto.anioPublicacion !== undefined) this.validaAnio(dto.anioPublicacion);
    if (dto.stock !== undefined) this.validaStock(dto.stock);

    Object.assign(book, dto);
    return this.booksRepository.save(book);
  }

  async remove(id: number): Promise<void> {
    const result = await this.booksRepository.delete(id);
    if ((result.affected ?? 0) === 0) {
      throw new NotFoundException('Libro no encontrado.');
    }
  }
}
