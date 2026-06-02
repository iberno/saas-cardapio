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
import { VariantesService } from './variantes.service';
import { TokenService } from '../../auth/shared/token.service';
import { CreateVarianteDto } from './dto/create-variante.dto';
import { UpdateVarianteDto } from './dto/update-variante.dto';

@Controller('tenants/:tenantId/produtos/:produtoId/variantes')
export class VariantesController {
  constructor(
    private service: VariantesService,
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
  create(@Param('produtoId') produtoId: string, @Body() dto: CreateVarianteDto, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.create(produtoId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVarianteDto, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.remove(id);
  }
}
