import { IsString, IsEmail, IsOptional } from 'class-validator';

export class TenantUserLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  slug?: string;
}
