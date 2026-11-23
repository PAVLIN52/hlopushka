import { CustomException } from './custom.exception';

/**
 * Объект уже изменён кем-то другим (оптимистическая блокировка по версии).
 * Глобальный фильтр отвечает статусом HTTP 409.
 */
export class ConflictException extends CustomException {}
