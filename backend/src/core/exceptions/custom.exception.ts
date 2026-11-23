/**
 * Базовое исключение приложения (принцип III конституции).
 *
 * Все прикладные ошибки выбрасываются только как CustomException или его наследники.
 * Глобальный фильтр NestJS (`common/filters/custom-exception.filter.ts`) переводит их
 * в HTTP-ответ вида `{ code, message, value }`.
 */
export class CustomException extends Error {
  /** Значение, вызвавшее ошибку (для отладки и для клиента). */
  public readonly value: unknown;

  /** Машиночитаемый код ошибки, например `TASK_NOT_FOUND`. */
  public readonly code: string;

  /**
   * @param message сообщение для пользователя на русском языке
   * @param value значение, вызвавшее ошибку
   * @param code код ошибки из `error-codes.ts`
   */
  constructor(message: string, value: unknown, code: string) {
    super(message);
    this.value = value;
    this.code = code;
    // Имя класса-наследника, а не «Error»: удобно в логах и в instanceof-проверках.
    this.name = new.target.name;
    // Восстанавливаем цепочку прототипов при компиляции в ES5/CommonJS.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
