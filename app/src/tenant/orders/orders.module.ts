import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { TokenService } from '../../auth/shared/token.service';
import { TenantOrPlatformGuard } from '../../common/guards/tenant-or-platform.guard';

@Module({
  imports: [JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }) })],
  controllers: [OrdersController],
  providers: [OrdersService, TokenService, TenantOrPlatformGuard],
})
export class OrdersModule {}
