import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { TokenService } from '../auth/shared/token.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }),
    }),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, TokenService],
})
export class ReviewsModule {}
