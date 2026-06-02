import { IsString, Matches } from 'class-validator';

export class CustomerLoginDto {
  @IsString()
  @Matches(/^\+[1-9]\d{10,14}$/, { message: 'Phone must be in E.164 format (+5511999999999)' })
  phone: string;
}
