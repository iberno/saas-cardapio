import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { StaffController } from './staff.controller'
import { StaffService } from './staff.service'
import { TokenService } from '../../auth/shared/token.service'

@Module({
  imports: [JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }) })],
  controllers: [StaffController],
  providers: [StaffService, TokenService],
})
export class StaffModule {}
