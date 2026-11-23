import { CustomException, ErrorCodes } from '../exceptions';

/**
 * Проверка границ для итераторов: одинаковые сообщения и коды во всех реализациях.
 *
 * @param size размер коллекции
 * @param hasNext есть ли ещё элементы
 * @param source имя итератора (попадает в `value` исключения)
 */
export function assertCanAdvance(size: number, hasNext: boolean, source: string): void {
  if (size === 0) {
    throw new CustomException('Коллекция пуста — обходить нечего', { source }, ErrorCodes.ITERATOR_EMPTY);
  }
  if (!hasNext) {
    throw new CustomException('Итератор дошёл до конца коллекции', { source, size }, ErrorCodes.ITERATOR_EXHAUSTED);
  }
}
