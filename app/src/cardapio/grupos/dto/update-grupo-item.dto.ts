import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateGrupoItemDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  preco?: number;
}
