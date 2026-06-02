import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  imagemUrl?: string;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
