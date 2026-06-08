import { IsOptional, IsString, IsBoolean, IsNumber, Min, Matches } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must contain only lowercase letters, numbers, and hyphens' }) slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() instagram?: string;
  @IsOptional() @IsString() hoursText?: string;
  @IsOptional() @IsString() paymentMethods?: string;
  @IsOptional() @IsBoolean() pointsEnabled?: boolean;
  @IsOptional() @IsNumber() @Min(0.5) pointsPerReais?: number;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() logoUrl?: string;
}
