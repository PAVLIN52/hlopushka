import type { ApiError } from '@hlopushka/shared';

/** Базовый адрес API (см. .env.example → NEXT_PUBLIC_API_URL). */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/**
 * Ошибка запроса к API: несёт HTTP-статус и тело `{ code, message, value }`.
 * Сообщение уже на русском — его можно показывать пользователю как есть.
 */
export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly value?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/** Один общий запрос на обновление сессии, даже если 401 пришёл сразу нескольким запросам. */
let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function toError(response: Response): Promise<ApiRequestError> {
  const body = (await response.json().catch(() => null)) as ApiError | null;
  return new ApiRequestError(
    response.status,
    body?.code ?? 'NETWORK',
    body?.message ?? 'Не удалось выполнить запрос',
    body?.value,
  );
}

/**
 * Запрос к API с cookie сессии. При 401 один раз пробует обновить сессию
 * через `/auth/refresh` и повторяет запрос; если не вышло — бросает ошибку 401.
 */
export async function apiRequest<T>(method: Method, path: string, body?: unknown, retry = true): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refreshSession()) return apiRequest<T>(method, path, body, false);
  }
  if (!response.ok) throw await toError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Короткие помощники для типовых методов. */
export const api = {
  get: <T>(path: string) => apiRequest<T>('GET', path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body: unknown) => apiRequest<T>('PATCH', path, body),
  delete: <T = void>(path: string) => apiRequest<T>('DELETE', path),
};
