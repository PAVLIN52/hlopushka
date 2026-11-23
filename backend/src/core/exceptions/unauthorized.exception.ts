import { CustomException } from './custom.exception';

/**
 * Нет действующей сессии: нет cookie, токен истёк или отозван.
 * Глобальный фильтр отвечает статусом HTTP 401.
 */
export class UnauthorizedException extends CustomException {}
