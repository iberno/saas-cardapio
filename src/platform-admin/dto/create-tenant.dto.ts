import { IsString, IsEmail, IsOptional } from 'class-validator';

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
}
