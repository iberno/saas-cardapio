import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformAuthService } from './platform-auth.service';
import { PasswordResetService } from '../shared/password-reset.service';
import { TotpService } from '../shared/totp.service';
import { TokenService } from '../shared/token.service';
import { AuditModule } from '../../infra/audit/audit.module';
import { MailModule } from '../../infra/mail/mail.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { algorithm: 'HS256' },
      }),
    }),
    AuditModule,
    MailModule,
  ],
  controllers: [PlatformAuthController],
  providers: [PlatformAuthService, PasswordResetService, TotpService, TokenService],
  exports: [TokenService],
})
export class PlatformAuthModule {}
