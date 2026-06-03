import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemAddonDto {
  @IsString()
  addonName: string;

  @IsNumber()
  addonPrice: number;

  @IsString()
  groupName: string;
}

class CreateOrderItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  productName: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemAddonDto)
  addons?: CreateOrderItemAddonDto[];
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
