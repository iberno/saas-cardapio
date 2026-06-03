import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { TenantOrPlatformGuard } from '../../common/guards/tenant-or-platform.guard';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { ReorderCategoriasDto } from './dto/reorder-categorias.dto';

@UseGuards(TenantOrPlatformGuard)
@Controller('tenants/:tenantId/categorias')
export class CategoriasController {
  constructor(private service: CategoriasService) {}

  @Get()
  findAll(@Param('tenantId') tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateCategoriaDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoriaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Put('reorder')
  reorder(@Param('tenantId') tenantId: string, @Body() dto: ReorderCategoriasDto) {
    return this.service.reorder(tenantId, dto.ordem);
  }
}
