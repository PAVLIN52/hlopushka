import { ValidationError, ValidationPipe } from '@nestjs/common';

import { ErrorCodes, ValidationException } from '@/core/exceptions';

/** Поле с ошибкой валидации — элемент `value` в ответе с кодом `VALIDATION`. */
export interface FieldError {
  field: string;
  messages: string[];
}

/** Разворачивает вложенные ошибки class-validator в плоский список полей. */
function flatten(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = error.constraints ? [{ field, messages: Object.values(error.constraints) }] : [];
    return [...own, ...flatten(error.children ?? [], field)];
  });
}

/**
 * Глобальная валидация DTO. Лишние поля отбрасываются, типы приводятся,
 * а ошибки превращаются в `ValidationException` с кодом `VALIDATION` (принцип III).
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const fields = flatten(errors);
      const first = fields[0]?.messages[0] ?? 'Некорректные данные';
      return new ValidationException(first, fields, ErrorCodes.VALIDATION);
    },
  });
}
