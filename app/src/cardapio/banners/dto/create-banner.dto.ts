import { IsString, IsOptional } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  imagemUrl: string;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;
}
