import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { PlatformAuthModule } from '../auth/platform/platform-auth.module';

@Module({
  imports: [PlatformAuthModule],
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class PlatformAdminModule {}
