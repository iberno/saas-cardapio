import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const traceId = (ctx.getRequest() as any).traceId;

    const err = exception as any;
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      response.status(status).json({
        statusCode: status,
        code: typeof res === 'string' ? 'ERROR' : (res as any).code || 'ERROR',
        message: typeof res === 'string' ? res : (res as any).message,
        traceId,
      });
    } else if (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 500) {
      // http-errors (e.g. ForbiddenError from csrf-csrf)
      response.status(err.statusCode).json({
        statusCode: err.statusCode,
        code: err.code || 'ERROR',
        message: err.message,
        traceId,
      });
    } else {
      this.logger.error(exception instanceof Error ? exception.message : String(exception), exception instanceof Error ? exception.stack : undefined);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        traceId,
      });
    }
  }
}
