import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  slug: string;

  @IsString()
  name: string;

  @IsEmail()
  contactEmail: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  ownerEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  ownerPassword?: string;
}
