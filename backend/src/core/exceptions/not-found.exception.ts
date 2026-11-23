import { CustomException } from './custom.exception';

/**
 * Запрошенный объект не найден (задача, проект, пользователь).
 * Глобальный фильтр отвечает статусом HTTP 404.
 */
export class NotFoundException extends CustomException {}
