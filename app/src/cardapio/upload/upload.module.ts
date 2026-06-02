import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { TenantModule } from '../../tenant/tenant.module';
import { TokenService } from '../../auth/shared/token.service';

@Module({
  imports: [
    JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }) }),
    MulterModule.register({ storage: memoryStorage() }),
    TenantModule,
  ],
  controllers: [UploadController],
  providers: [UploadService, TokenService],
  exports: [UploadService],
})
export class UploadModule {}
