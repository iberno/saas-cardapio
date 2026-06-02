import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateGrupoItemDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  preco?: number;
}
