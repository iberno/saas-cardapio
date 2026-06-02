import { IsString, IsEmail } from 'class-validator';

export class TenantUserLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
