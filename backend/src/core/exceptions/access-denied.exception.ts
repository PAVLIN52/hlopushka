import { CustomException } from './custom.exception';

/**
 * Действие запрещено для текущего пользователя или его роли.
 * Глобальный фильтр отвечает статусом HTTP 403.
 */
export class AccessDeniedException extends CustomException {}
