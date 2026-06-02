import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const traceId = (ctx.getRequest() as any).traceId;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      response.status(status).json({
        statusCode: status,
        code: typeof res === 'string' ? 'ERROR' : (res as any).code || 'ERROR',
        message: typeof res === 'string' ? res : (res as any).message,
        traceId,
      });
    } else {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        traceId,
      });
    }
  }
}
