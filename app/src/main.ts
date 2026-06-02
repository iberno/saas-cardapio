import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { doubleCsrf } from 'csrf-csrf';
import { TraceIdInterceptor } from './common/interceptors/trace-id.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api');

  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: /^https?:\/\/([a-z0-9-]+\.)?(saas-cardapio\.local|lvh\.me|localhost)(:\d+)?$/,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  });

  const { doubleCsrfProtection, generateToken } = doubleCsrf({
    getSecret: () => process.env.JWT_SECRET!.slice(0, 32),
    cookieName: '_csrf',
    cookieOptions: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  });
  app.use(doubleCsrfProtection);

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/auth/csrf', (req: any, res: any) => {
    const token = generateToken(req, res);
    res.json({ csrfToken: token });
  });

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TraceIdInterceptor());

  await app.listen(process.env.PORT || 3001);
}
bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection', reason);
});
