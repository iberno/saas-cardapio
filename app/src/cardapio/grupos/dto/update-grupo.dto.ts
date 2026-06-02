import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateGrupoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxSelect?: number;
}
