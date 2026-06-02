import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateGrupoDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxSelect?: number;
}
