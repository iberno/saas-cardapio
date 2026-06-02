import { IsArray, IsString } from 'class-validator';

export class ReorderCategoriasDto {
  @IsArray()
  @IsString({ each: true })
  ordem: string[];
}
