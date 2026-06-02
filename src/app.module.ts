import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { PlatformAuthModule } from './auth/platform/platform-auth.module';
import { TenantUserAuthModule } from './auth/tenant-user/tenant-user-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    EventEmitterModule.forRoot(),
    HealthModule,
    PrismaModule,
    TenantModule,
    PlatformAuthModule,
    TenantUserAuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

function validateEnv(config: Record<string, unknown>) {
  if (!config.JWT_SECRET) throw new Error('JWT_SECRET is required');
  if (!config.DATABASE_URL) throw new Error('DATABASE_URL is required');
  return config;
}
