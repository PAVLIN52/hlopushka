/** Тело ответа с ошибкой — единое для всех эндпоинтов (contracts/rest-api.md). */
export interface ApiError {
  /** Машиночитаемый код ошибки, например `STAGE_TRANSITION_FORBIDDEN`. */
  code: string;
  /** Сообщение для пользователя на русском языке. */
  message: string;
  /** Значение, вызвавшее ошибку (может отсутствовать). */
  value?: unknown;
}
