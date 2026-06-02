import { Controller, Post, Delete, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { TenantUserAuthGuard } from '../../common/guards/tenant-user-auth.guard';
import { TenantService } from '../../tenant/tenant.service';
import { UploadService } from './upload.service';

@Controller('tenants/:tenantId')
@UseGuards(TenantUserAuthGuard)
export class UploadController {
  constructor(
    private service: UploadService,
    private tenantService: TenantService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
        cb(new BadRequestException('Only jpg, png, webp allowed'), false);
      } else cb(null, true);
    },
  }))
  async upload(@Param('tenantId') tenantId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File required');
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new BadRequestException('Tenant not found');
    return this.service.upload(file, tenant.slug);
  }

  @Delete('uploads/:filename')
  async delete(@Param('tenantId') tenantId: string, @Param('filename') filename: string) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new BadRequestException('Tenant not found');
    this.service.delete(filename, tenant.slug);
    return { success: true };
  }
}
