/** Имена cookie с токенами. */
export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

/** Время жизни токенов (research.md R2). */
export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Полезная нагрузка access-токена. */
export interface AccessPayload {
  sub: string;
  typ: 'access';
}

/** Полезная нагрузка refresh-токена: `sid` — идентификатор сессии в БД. */
export interface RefreshPayload {
  sub: string;
  sid: string;
  typ: 'refresh';
}

/** Пара выпущенных токенов. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
