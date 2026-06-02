import { IsString, IsNumber, IsEnum, IsBoolean, IsOptional, Min } from 'class-validator';
import { Categoria } from '@prisma/client';

export class CreateProdutoDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNumber()
  @Min(0)
  preco: number;

  @IsEnum(Categoria)
  categoria: Categoria;

  @IsOptional()
  @IsBoolean()
  disponivel?: boolean;

  @IsOptional()
  @IsBoolean()
  destaque?: boolean;

  @IsOptional()
  @IsString()
  imagemUrl?: string;
}
