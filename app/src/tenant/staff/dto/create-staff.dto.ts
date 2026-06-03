import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator'

export class CreateStaffDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string

  @IsString()
  name: string

  @IsOptional()
  @IsIn(['OWNER', 'STAFF'])
  role?: 'OWNER' | 'STAFF'
}
