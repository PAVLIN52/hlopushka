import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { ApiError } from '@hlopushka/shared';

import {
  AccessDeniedException,
  ConflictException,
  CustomException,
  ErrorCodes,
  NotFoundException,
  UnauthorizedException,
  ValidationException,
} from '@/core/exceptions';
import { AppLogger } from '@/core/patterns/singleton';

/** Соответствие классов исключений HTTP-статусам (data-model.md §2.1). */
const STATUS_BY_EXCEPTION: ReadonlyArray<[new (...args: never[]) => CustomException, number]> = [
  [UnauthorizedException, HttpStatus.UNAUTHORIZED],
  [NotFoundException, HttpStatus.NOT_FOUND],
  [ValidationException, HttpStatus.BAD_REQUEST],
  [AccessDeniedException, HttpStatus.FORBIDDEN],
  [ConflictException, HttpStatus.CONFLICT],
];

/**
 * Единственное место, где исключения превращаются в HTTP-ответы (принцип III).
 *
 * - наследники `CustomException` → свой статус и тело `{ code, message, value }`;
 * - ошибки валидации DTO (их создаёт `ValidationPipe` через `exceptionFactory`)
 *   уже приходят как `ValidationException` с кодом `VALIDATION`;
 * - всё остальное (NestJS, Prisma, баги) → 500, исходная ошибка пишется в журнал.
 */
@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  private readonly logger = AppLogger.getInstance();

  public catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toResponse(exception);
    response.status(status).json(body);
  }

  /** Строит статус и тело ответа для любого исключения. */
  public toResponse(exception: unknown): { status: number; body: ApiError } {
    if (exception instanceof CustomException) {
      const match = STATUS_BY_EXCEPTION.find(([type]) => exception instanceof type);
      const status = match ? match[1] : HttpStatus.INTERNAL_SERVER_ERROR;
      return { status, body: { code: exception.code, message: exception.message, value: exception.value } };
    }

    // Маршрут не найден и подобные ошибки самого фреймворка — не «сбой сервера».
    if (exception instanceof HttpException && exception.getStatus() === HttpStatus.NOT_FOUND) {
      return {
        status: HttpStatus.NOT_FOUND,
        body: { code: 'ROUTE_NOT_FOUND', message: 'Адрес не найден' },
      };
    }

    const error = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(error.message, 'CustomExceptionFilter', error.stack);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: ErrorCodes.INTERNAL, message: 'Внутренняя ошибка сервера. Попробуйте ещё раз.' },
    };
  }
}
