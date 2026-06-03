import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { VariantesService } from './variantes.service';
import { TenantOrPlatformGuard } from '../../common/guards/tenant-or-platform.guard';
import { CreateVarianteDto } from './dto/create-variante.dto';
import { UpdateVarianteDto } from './dto/update-variante.dto';

@UseGuards(TenantOrPlatformGuard)
@Controller('tenants/:tenantId/produtos/:produtoId/variantes')
export class VariantesController {
  constructor(private service: VariantesService) {}

  @Get()
  findAll(@Param('produtoId') produtoId: string) {
    return this.service.findAll(produtoId);
  }

  @Post()
  create(@Param('produtoId') produtoId: string, @Body() dto: CreateVarianteDto) {
    return this.service.create(produtoId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVarianteDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
