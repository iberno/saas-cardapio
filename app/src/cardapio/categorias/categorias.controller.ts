import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { TokenService } from '../../auth/shared/token.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { ReorderCategoriasDto } from './dto/reorder-categorias.dto';

@Controller('tenants/:tenantId/categorias')
export class CategoriasController {
  constructor(
    private service: CategoriasService,
    private tokenService: TokenService,
  ) {}

  private verifyAuth(cookies: Record<string, string> | undefined) {
    const token = cookies?.tu_session || cookies?.pa_session;
    if (!token) throw new UnauthorizedException();
    this.tokenService.verifyAccessToken(token);
  }

  @Get()
  findAll(@Param('tenantId') tenantId: string, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.findAll(tenantId);
  }

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateCategoriaDto, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoriaDto, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.remove(id);
  }

  @Put('reorder')
  reorder(@Param('tenantId') tenantId: string, @Body() dto: ReorderCategoriasDto, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.reorder(tenantId, dto.ordem);
  }
}
