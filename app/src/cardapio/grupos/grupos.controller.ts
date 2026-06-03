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
import { GruposService } from './grupos.service';
import { TenantOrPlatformGuard } from '../../common/guards/tenant-or-platform.guard';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { CreateGrupoItemDto } from './dto/create-grupo-item.dto';
import { UpdateGrupoItemDto } from './dto/update-grupo-item.dto';

@UseGuards(TenantOrPlatformGuard)
@Controller('tenants/:tenantId/produtos/:produtoId/grupos')
export class GruposController {
  constructor(private service: GruposService) {}

  @Get()
  findAll(@Param('produtoId') produtoId: string) {
    return this.service.findAll(produtoId);
  }

  @Post()
  create(@Param('produtoId') produtoId: string, @Body() dto: CreateGrupoDto) {
    return this.service.create(produtoId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGrupoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

@UseGuards(TenantOrPlatformGuard)
@Controller('tenants/:tenantId/grupos/:grupoId/itens')
export class GrupoItensController {
  constructor(private service: GruposService) {}

  @Post()
  criarItem(@Param('grupoId') grupoId: string, @Body() dto: CreateGrupoItemDto) {
    return this.service.criarItem(grupoId, dto);
  }

  @Patch(':id')
  atualizarItem(@Param('id') id: string, @Body() dto: UpdateGrupoItemDto) {
    return this.service.atualizarItem(id, dto);
  }

  @Delete(':id')
  removerItem(@Param('id') id: string) {
    return this.service.removerItem(id);
  }
}
