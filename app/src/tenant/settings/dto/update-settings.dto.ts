import { IsOptional, IsString, IsBoolean, IsNumber, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() instagram?: string;
  @IsOptional() @IsString() hoursText?: string;
  @IsOptional() @IsString() paymentMethods?: string;
  @IsOptional() @IsBoolean() pointsEnabled?: boolean;
  @IsOptional() @IsNumber() @Min(0.5) pointsPerReais?: number;
  @IsOptional() @IsString() contactPhone?: string;
}
