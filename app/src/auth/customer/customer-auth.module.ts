import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from '../shared/token.service';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }),
    }),
  ],
  controllers: [CustomerAuthController],
  providers: [CustomerAuthService, TokenService],
})
export class CustomerAuthModule {}
