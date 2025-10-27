import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsIn,
  IsBooleanString,
} from 'class-validator';
import { CATEGORIAS } from '../entities/book.entity';

export class QueryBookDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn([...CATEGORIAS])
  categoria?: string;

  @IsOptional()
  @IsInt()
  @Min(1450)
  anioDesde?: number;

  @IsOptional()
  @IsInt()
  @Max(new Date().getFullYear())
  anioHasta?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /** '1' o 'true' para filtrar con stock > 0 */
  @IsOptional()
  @IsBooleanString()
  conStock?: string;
}
