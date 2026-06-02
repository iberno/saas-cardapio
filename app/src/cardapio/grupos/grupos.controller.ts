import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { GruposService } from './grupos.service';
import { TokenService } from '../../auth/shared/token.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { CreateGrupoItemDto } from './dto/create-grupo-item.dto';
import { UpdateGrupoItemDto } from './dto/update-grupo-item.dto';

@Controller('tenants/:tenantId/produtos/:produtoId/grupos')
export class GruposController {
  constructor(
    private service: GruposService,
    private tokenService: TokenService,
  ) {}

  private verifyAuth(cookies: Record<string, string> | undefined) {
    const token = cookies?.tu_session || cookies?.pa_session;
    if (!token) throw new UnauthorizedException();
    this.tokenService.verifyAccessToken(token);
  }

  @Get()
  findAll(@Param('produtoId') produtoId: string, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.findAll(produtoId);
  }

  @Post()
  create(@Param('produtoId') produtoId: string, @Body() dto: CreateGrupoDto, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.create(produtoId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGrupoDto, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.remove(id);
  }
}

@Controller('tenants/:tenantId/grupos/:grupoId/itens')
export class GrupoItensController {
  constructor(
    private service: GruposService,
    private tokenService: TokenService,
  ) {}

  private verifyAuth(cookies: Record<string, string> | undefined) {
    const token = cookies?.tu_session || cookies?.pa_session;
    if (!token) throw new UnauthorizedException();
    this.tokenService.verifyAccessToken(token);
  }

  @Post()
  criarItem(@Param('grupoId') grupoId: string, @Body() dto: CreateGrupoItemDto, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.criarItem(grupoId, dto);
  }

  @Patch(':id')
  atualizarItem(@Param('id') id: string, @Body() dto: UpdateGrupoItemDto, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.atualizarItem(id, dto);
  }

  @Delete(':id')
  removerItem(@Param('id') id: string, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.removerItem(id);
  }
}
