import { CustomException } from './custom.exception';

/**
 * Входные данные нарушают правила предметной области.
 * Глобальный фильтр отвечает статусом HTTP 400.
 */
export class ValidationException extends CustomException {}
