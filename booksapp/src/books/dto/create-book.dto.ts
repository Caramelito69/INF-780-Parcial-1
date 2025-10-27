import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  Length,
  IsIn,
  IsNumber,
} from 'class-validator';
import { CATEGORIAS } from '../entities/book.entity';

export class CreateBookDto {
  @IsString()
  @Length(3, 150)
  titulo!: string;

  @IsString()
  @Length(3, 120)
  autor!: string;

  @IsOptional()
  @IsString()
  isbn?: string; // se valida formato en el servicio

  @IsOptional()
  @IsInt()
  @Min(1450)
  @Max(new Date().getFullYear())
  anioPublicacion?: number;

  @IsOptional()
  @IsIn([...CATEGORIAS])
  categoria?: (typeof CATEGORIAS)[number];

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}
