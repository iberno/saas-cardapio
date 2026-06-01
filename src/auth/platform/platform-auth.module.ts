import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformAuthService } from './platform-auth.service';
import { TokenService } from '../shared/token.service';
import { AuditModule } from '../../infra/audit/audit.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { algorithm: 'HS256' },
      }),
    }),
    AuditModule,
  ],
  controllers: [PlatformAuthController],
  providers: [PlatformAuthService, TokenService],
  exports: [TokenService],
})
export class PlatformAuthModule {}
