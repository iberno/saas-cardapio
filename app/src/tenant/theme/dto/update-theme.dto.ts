import { IsOptional, IsString } from 'class-validator';

export class UpdateThemeDto {
  @IsOptional() @IsString() primary?: string;
  @IsOptional() @IsString() primaryContent?: string;
  @IsOptional() @IsString() secondary?: string;
  @IsOptional() @IsString() secondaryContent?: string;
  @IsOptional() @IsString() accent?: string;
  @IsOptional() @IsString() accentContent?: string;
  @IsOptional() @IsString() neutral?: string;
  @IsOptional() @IsString() neutralContent?: string;
  @IsOptional() @IsString() base100?: string;
  @IsOptional() @IsString() base200?: string;
  @IsOptional() @IsString() base300?: string;
  @IsOptional() @IsString() baseContent?: string;
}
