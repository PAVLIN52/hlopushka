import { Injectable, PipeTransform } from '@nestjs/common';

import { NotFoundException } from '@/core/exceptions';

/** Формат UUID: идентификаторы с другим форматом заведомо не существуют. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Проверяет, что параметр маршрута — UUID. Иначе отвечает «не найдено» с кодом сущности
 * (а не ошибкой БД): `@Param('userId', new UuidPipe('Участник не найден', ErrorCodes.MEMBER_NOT_FOUND))`.
 */
@Injectable()
export class UuidPipe implements PipeTransform<string, string> {
  constructor(
    private readonly message: string,
    private readonly code: string,
  ) {}

  public transform(value: string): string {
    if (!UUID.test(value)) throw new NotFoundException(this.message, value, this.code);
    return value;
  }
}
