import { IsString, IsNumber, IsEnum, IsBoolean, IsOptional, Min } from 'class-validator';
import { Categoria } from '@prisma/client';

export class UpdateProdutoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  preco?: number;

  @IsOptional()
  @IsEnum(Categoria)
  categoria?: Categoria;

  @IsOptional()
  @IsString()
  categoriaId?: string;

  @IsOptional()
  @IsBoolean()
  disponivel?: boolean;

  @IsOptional()
  @IsBoolean()
  destaque?: boolean;

  @IsOptional()
  @IsString()
  imagemUrl?: string;

  @IsOptional()
  @IsBoolean()
  exibirPrecoAPartirDe?: boolean;
}
