import { IsString, IsNumber, Min } from 'class-validator';

export class CreateVarianteDto {
  @IsString()
  nome: string;

  @IsNumber()
  @Min(0)
  preco: number;
}
