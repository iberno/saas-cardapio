import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator'

export class UpdateStaffDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsIn(['OWNER', 'STAFF'])
  role?: 'OWNER' | 'STAFF'
}
