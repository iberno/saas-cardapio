import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CardapioService } from './cardapio.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { TenantOrPlatformGuard } from '../common/guards/tenant-or-platform.guard';
import { Categoria } from '@prisma/client';

@UseGuards(TenantOrPlatformGuard)
@Controller('tenants/:tenantId/produtos')
export class CardapioController {
  constructor(private service: CardapioService) {}

  @Get()
  findAll(
    @Param('tenantId') tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoria') categoria?: Categoria,
    @Query('ordenacao') ordenacao?: string,
  ) {
    return this.service.findAll(tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      categoria,
      ordenacao,
    });
  }

  @Get(':id')
  findOne(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateProdutoDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProdutoDto,
  ) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }
}
