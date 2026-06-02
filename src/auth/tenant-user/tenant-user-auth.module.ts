import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TenantUserAuthController } from './tenant-user-auth.controller';
import { TenantUserAuthService } from './tenant-user-auth.service';
import { TokenService } from '../shared/token.service';
import { AuditModule } from '../../infra/audit/audit.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }),
    }),
    AuditModule,
  ],
  controllers: [TenantUserAuthController],
  providers: [TenantUserAuthService, TokenService],
})
export class TenantUserAuthModule {}
