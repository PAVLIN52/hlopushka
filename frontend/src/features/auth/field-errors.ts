import { ApiRequestError } from '@/lib/api-client';

/** Ошибки по полям формы: `{ email: 'Некорректный email' }`. */
export type FieldErrors = Partial<Record<string, string>>;

/**
 * Раскладывает ответ API по полям формы.
 * `VALIDATION` содержит список полей, а коды вроде `AUTH_EMAIL_TAKEN` относятся к одному полю.
 */
export function toFieldErrors(error: unknown): { fields: FieldErrors; common: string | null } {
  if (!(error instanceof ApiRequestError)) {
    return { fields: {}, common: 'Сервер недоступен. Проверьте подключение и попробуйте ещё раз.' };
  }
  if (error.code === 'VALIDATION' && Array.isArray(error.value)) {
    const fields: FieldErrors = {};
    for (const item of error.value as Array<{ field: string; messages: string[] }>) {
      fields[item.field] ??= item.messages[0];
    }
    return { fields, common: null };
  }
  if (error.code === 'AUTH_EMAIL_TAKEN') return { fields: { email: error.message }, common: null };
  if (error.code === 'AUTH_WEAK_PASSWORD') return { fields: { password: error.message }, common: null };
  return { fields: {}, common: error.message };
}
