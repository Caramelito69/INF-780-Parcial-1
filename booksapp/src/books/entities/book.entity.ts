import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export const CATEGORIAS = [
  'ficcion',
  'no_ficcion',
  'tecnico',
  'academico',
  'infantil',
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

@Entity('books')
@Index(['titulo', 'autor'], { unique: true })
export class Book {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150 })
  titulo!: string;

  @Column({ length: 120 })
  autor!: string;

  @Column({ length: 20, nullable: true })
  isbn?: string;

  @Column({ type: 'int', nullable: true })
  anioPublicacion?: number;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  categoria?: Categoria;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @CreateDateColumn()
  creadoEn!: Date;

  @UpdateDateColumn()
  actualizadoEn!: Date;
}
