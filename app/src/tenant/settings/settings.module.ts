import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { TokenService } from '../../auth/shared/token.service';

@Module({
  imports: [JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }) })],
  controllers: [SettingsController],
  providers: [SettingsService, TokenService],
})
export class SettingsModule {}
