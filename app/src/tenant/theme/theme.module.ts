import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThemeController } from './theme.controller';
import { ThemeService } from './theme.service';
import { TokenService } from '../../auth/shared/token.service';

@Module({
  imports: [JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }) })],
  controllers: [ThemeController],
  providers: [ThemeService, TokenService],
})
export class ThemeModule {}
