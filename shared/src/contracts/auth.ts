/** Контракты авторизации (contracts/rest-api.md → Auth). */

/** Тело `POST /auth/register`. */
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

/** Тело `POST /auth/login`. */
export interface LoginDto {
  email: string;
  password: string;
}

/** Пользователь в ответах API. Хеш пароля не отдаётся никогда. */
export interface UserDto {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

/** Ответ на регистрацию, вход и `GET /auth/me`. */
export interface AuthResponse {
  user: UserDto;
}
